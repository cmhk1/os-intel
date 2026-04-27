/**
 * AIS Ingest — Supabase Edge Function
 *
 * Called every 5 minutes by GitHub Actions.
 * Connects to AISStream WebSocket, subscribes to all tracked vessel MMSIs,
 * collects position reports for up to 25 seconds, then upserts into the DB.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LISTEN_MS = 25_000;

const NAV_STATUS: Record<number, string> = {
  0: "Under way using engine",
  1: "At anchor",
  2: "Not under command",
  3: "Restricted manoeuvrability",
  5: "Moored",
  6: "Aground",
  7: "Engaged in fishing",
  8: "Under way sailing",
  15: "Not defined",
};

function navStatus(code: number): string {
  return NAV_STATUS[code] ?? "Under way using engine";
}

// Heading 511 means "not available" in AIS — fall back to COG
function resolveHeading(trueHeading: number, cog: number): number {
  return trueHeading === 511 ? Math.round(cog) : trueHeading;
}

interface PositionFix {
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  status: string;
  destination: string | null;
  shipName: string | null;
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const aisKey      = Deno.env.get("AISSTREAM_API_KEY");

  if (!aisKey) {
    return json({ ok: false, error: "AISSTREAM_API_KEY not set" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Fetch all MMSIs currently in the vessels table
  const { data: tracked, error: fetchErr } = await supabase
    .from("vessels")
    .select("id, mmsi, name")
    .not("mmsi", "is", null);

  if (fetchErr || !tracked?.length) {
    return json({ ok: false, error: fetchErr?.message ?? "No vessels with MMSI found" }, 500);
  }

  const mmsiList   = tracked.map((v) => v.mmsi as string);
  const byMmsi     = Object.fromEntries(tracked.map((v) => [v.mmsi, v]));
  const fixes      = new Map<string, PositionFix>();

  // ── AISStream WebSocket ────────────────────────────────────────────────────
  await new Promise<void>((resolve) => {
    const ws      = new WebSocket("wss://stream.aisstream.io/v0/stream");
    const timer   = setTimeout(() => { try { ws.close(); } catch { /**/ } resolve(); }, LISTEN_MS);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        APIKey:             aisKey,
        BoundingBoxes:      [[[-90, -180], [90, 180]]],
        FiltersShipMMSI:    mmsiList,
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        const mmsi = String(msg.MetaData?.MMSI ?? "");
        if (!mmsi || !byMmsi[mmsi]) return;

        if (msg.MessageType === "PositionReport") {
          const pr = msg.Message?.PositionReport;
          if (!pr) return;
          fixes.set(mmsi, {
            lat:         pr.Latitude,
            lon:         pr.Longitude,
            speed:       pr.Sog ?? 0,
            heading:     resolveHeading(pr.TrueHeading ?? 511, pr.Cog ?? 0),
            status:      navStatus(pr.NavigationalStatus ?? 0),
            destination: (msg.MetaData?.Destination as string | undefined)?.trim() || fixes.get(mmsi)?.destination ?? null,
            shipName:    (msg.MetaData?.ShipName as string | undefined)?.trim() || fixes.get(mmsi)?.shipName ?? null,
          });
        }

        if (msg.MessageType === "ShipStaticData") {
          const sd = msg.Message?.ShipStaticData;
          if (!sd) return;
          const existing = fixes.get(mmsi);
          if (existing) {
            existing.destination = sd.Destination?.trim() || existing.destination;
            existing.shipName    = sd.Name?.trim()        || existing.shipName;
          }
        }

        // Once we have a fix for every tracked vessel, no need to wait longer
        if (fixes.size === mmsiList.length) {
          clearTimeout(timer);
          ws.close();
          resolve();
        }
      } catch { /**/ }
    };

    ws.onerror = () => { clearTimeout(timer); resolve(); };
    ws.onclose = () => { clearTimeout(timer); resolve(); };
  });

  if (!fixes.size) {
    return json({ ok: true, tracked: mmsiList.length, updated: 0, message: "No position reports received within window" });
  }

  // ── Write to DB ────────────────────────────────────────────────────────────
  const now    = new Date().toISOString();
  let updated  = 0;
  const errors: string[] = [];

  await Promise.all(
    [...fixes.entries()].map(async ([mmsi, fix]) => {
      const vessel = byMmsi[mmsi];

      const { error: upErr } = await supabase
        .from("vessels")
        .update({
          last_position_lat: fix.lat,
          last_position_lon: fix.lon,
          last_position_at:  now,
          last_speed:        fix.speed,
          last_heading:      fix.heading,
          last_status:       fix.status,
          ...(fix.destination ? { destination: fix.destination } : {}),
          ...(fix.shipName    ? { name: fix.shipName }           : {}),
          ais_gaps_24h:      0,
          updated_at:        now,
        })
        .eq("id", vessel.id);

      if (upErr) { errors.push(`${mmsi}: ${upErr.message}`); return; }

      await supabase.from("vessel_positions").insert({
        vessel_id:   vessel.id,
        lat:         fix.lat,
        lon:         fix.lon,
        speed:       fix.speed,
        heading:     fix.heading,
        status:      fix.status,
        recorded_at: now,
        source:      "aisstream",
      });

      updated++;
    })
  );

  // Mark vessels that sent NO fix this cycle as potentially gapped
  const missedMmsis = mmsiList.filter((m) => !fixes.has(m));
  if (missedMmsis.length) {
    await supabase
      .from("vessels")
      .update({ ais_gaps_24h: supabase.rpc("ais_gaps_24h_increment" as never) })
      .in("mmsi", missedMmsis);
  }

  return json({
    ok:                 true,
    timestamp:          now,
    tracked:            mmsiList.length,
    fixes_received:     fixes.size,
    updated,
    missed:             missedMmsis,
    errors:             errors.length ? errors : undefined,
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * AIS Ingest — Supabase Edge Function
 *
 * Called every 5 minutes by GitHub Actions.
 * Connects to AISStream WebSocket, subscribes to all tracked vessel MMSIs,
 * collects position reports for up to 20 seconds, then upserts into the DB.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LISTEN_MS = 20_000;

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

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const aisKey      = Deno.env.get("AISSTREAM_API_KEY");

  if (!aisKey) {
    return json({ ok: false, error: "AISSTREAM_API_KEY not set" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Optional single-MMSI lookup mode (called from /api/vessels/lookup via Next.js)
  let singleMmsi: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body?.mmsi && /^\d{9}$/.test(String(body.mmsi))) {
        singleMmsi = String(body.mmsi);
      }
    } catch { /* no body or not JSON — fall through to full cron mode */ }
  }

  // Fetch vessels from DB. In single-MMSI mode the vessel may not exist yet —
  // that's fine, we go to AISStream anyway and upsert after getting the fix.
  const { data: tracked, error: fetchErr } = await supabase
    .from("vessels")
    .select("id, mmsi, name")
    .not("mmsi", "is", null);

  if (fetchErr) {
    return json({ ok: false, error: fetchErr.message }, 500);
  }

  // Cron mode needs at least one vessel in the DB to know what to track.
  if (!singleMmsi && !tracked?.length) {
    return json({ ok: true, tracked: 0, updated: 0, message: "No vessels with MMSI in DB" });
  }

  // Build lookup structures — single-MMSI mode uses just that MMSI even if new.
  const mmsiList = singleMmsi
    ? [singleMmsi]
    : (tracked ?? []).map((v) => v.mmsi as string);
  const byMmsi   = Object.fromEntries((tracked ?? []).map((v) => [v.mmsi, v]));
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
        if (!mmsi) return;
        // Cron mode: must be in tracked DB list. Lookup mode: must match request.
        if (!singleMmsi && !byMmsi[mmsi]) return;
        if (singleMmsi && mmsi !== singleMmsi) return;

        if (msg.MessageType === "PositionReport") {
          const pr = msg.Message?.PositionReport;
          if (!pr) return;
          const prevDest = fixes.get(mmsi)?.destination ?? null;
          const prevName = fixes.get(mmsi)?.shipName ?? null;
          fixes.set(mmsi, {
            lat:         pr.Latitude,
            lon:         pr.Longitude,
            speed:       pr.Sog ?? 0,
            heading:     resolveHeading(pr.TrueHeading ?? 511, pr.Cog ?? 0),
            status:      navStatus(pr.NavigationalStatus ?? 0),
            destination: ((msg.MetaData?.Destination as string | undefined)?.trim()) || prevDest,
            shipName:    ((msg.MetaData?.ShipName as string | undefined)?.trim()) || prevName,
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
    if (singleMmsi) {
      return json({ error: "Vessel not responding — not currently broadcasting AIS" }, 404);
    }
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

  // Single-MMSI lookup: upsert via RPC (handles new vessels not yet in the DB)
  // and return the vessel row for the frontend.
  if (singleMmsi) {
    const fix = fixes.get(singleMmsi)!;
    const { data, error: rpcErr } = await supabase.rpc("upsert_vessel_from_ais", {
      p_mmsi:        singleMmsi,
      p_name:        fix.shipName ?? `VESSEL ${singleMmsi}`,
      p_lat:         fix.lat,
      p_lon:         fix.lon,
      p_speed:       fix.speed,
      p_heading:     fix.heading,
      p_status:      fix.status,
      p_destination: fix.destination,
      p_imo:         null,
    });
    if (rpcErr) return json({ error: rpcErr.message }, 500);
    const vessel = Array.isArray(data) ? data[0] : data;
    return json({ vessel });
  }

  return json({
    ok:             true,
    timestamp:      now,
    tracked:        mmsiList.length,
    fixes_received: fixes.size,
    updated,
    errors:         errors.length ? errors : undefined,
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

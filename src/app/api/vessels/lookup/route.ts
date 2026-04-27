/**
 * POST /api/vessels/lookup
 * Body: { mmsi: string }
 *
 * Opens an AISStream WebSocket, subscribes to the requested MMSI,
 * waits up to 20s for a position report, then upserts the vessel
 * via a SECURITY DEFINER RPC (no service role key needed in Next.js).
 */

import { NextRequest, NextResponse } from "next/server";
import { createBrowserClient } from "@/lib/supabase/client";

export const runtime  = "nodejs";
export const maxDuration = 30;

const TIMEOUT_MS = 20_000;

const NAV_STATUS: Record<number, string> = {
  0: "Under way using engine",
  1: "At anchor",
  5: "Moored",
  8: "Under way sailing",
};
function navStatus(code: number) { return NAV_STATUS[code] ?? "Under way using engine"; }
function resolveHeading(h: number, cog: number) { return h === 511 ? Math.round(cog) : h; }

interface AISFix {
  name: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  status: string;
  destination: string | null;
  imo: string | null;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mmsi = String(body.mmsi ?? "").trim();

  if (!/^\d{9}$/.test(mmsi)) {
    return NextResponse.json({ error: "MMSI must be exactly 9 digits" }, { status: 400 });
  }

  const aisKey = process.env.AISSTREAM_API_KEY;
  if (!aisKey) {
    return NextResponse.json({ error: "AIS service not configured" }, { status: 503 });
  }

  // ── Connect to AISStream and wait for a fix ──────────────────────────────
  let fix: AISFix | null = null;

  await new Promise<void>((resolve) => {
    // Node 18 does not ship a stable global WebSocket — use the one from
    // the 'ws' package if available, otherwise fall back to undici's.
    // We import dynamically so the module resolution works on both runtimes.
    let ws: WebSocket;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { WebSocket: WS } = require("ws");
      ws = new WS("wss://stream.aisstream.io/v0/stream") as unknown as WebSocket;
    } catch {
      ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
    }

    const timer = setTimeout(() => { try { ws.close(); } catch { /**/ } resolve(); }, TIMEOUT_MS);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        APIKey:             aisKey,
        BoundingBoxes:      [[[-90, -180], [90, 180]]],
        FiltersShipMMSI:    [mmsi],
        FilterMessageTypes: ["PositionReport", "ShipStaticData"],
      }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.MessageType === "PositionReport") {
          const pr = msg.Message?.PositionReport;
          if (!pr) return;
          fix = {
            name:        (msg.MetaData?.ShipName as string | undefined)?.trim() || `VESSEL ${mmsi}`,
            lat:         pr.Latitude,
            lon:         pr.Longitude,
            speed:       pr.Sog ?? 0,
            heading:     resolveHeading(pr.TrueHeading ?? 511, pr.Cog ?? 0),
            status:      navStatus(pr.NavigationalStatus ?? 0),
            destination: (msg.MetaData?.Destination as string | undefined)?.trim() || null,
            imo:         fix?.imo ?? null,
          };
          clearTimeout(timer);
          ws.close();
          resolve();
        }

        if (msg.MessageType === "ShipStaticData") {
          const sd = msg.Message?.ShipStaticData;
          if (!sd) return;
          if (fix) {
            fix.imo  = sd.ImoNumber ? String(sd.ImoNumber) : fix.imo;
            fix.name = sd.Name?.trim() || fix.name;
            fix.destination = sd.Destination?.trim() || fix.destination;
          }
        }
      } catch { /**/ }
    };

    ws.onerror = () => { clearTimeout(timer); resolve(); };
    ws.onclose = () => { clearTimeout(timer); resolve(); };
  });

  if (!fix) {
    return NextResponse.json(
      { error: "Vessel not responding — not currently broadcasting AIS" },
      { status: 404 }
    );
  }

  // ── Upsert via SECURITY DEFINER RPC (anon key is fine) ──────────────────
  const supabase = createBrowserClient();
  const { data, error } = await supabase.rpc("upsert_vessel_from_ais", {
    p_mmsi:        mmsi,
    p_name:        fix.name,
    p_lat:         fix.lat,
    p_lon:         fix.lon,
    p_speed:       fix.speed,
    p_heading:     fix.heading,
    p_status:      fix.status,
    p_destination: fix.destination,
    p_imo:         fix.imo,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const vessel = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ vessel });
}

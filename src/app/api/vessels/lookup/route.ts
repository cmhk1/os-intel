/**
 * POST /api/vessels/lookup
 * Body: { mmsi: string }
 *
 * Thin proxy to the ais-ingest Supabase Edge Function.
 * AISStream is called there — the AISSTREAM_API_KEY never touches Next.js.
 * Only the public NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are needed.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const mmsi = String(body.mmsi ?? "").trim();

  if (!/^\d{9}$/.test(mmsi)) {
    return NextResponse.json({ error: "MMSI must be exactly 9 digits" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/ais-ingest`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ mmsi }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

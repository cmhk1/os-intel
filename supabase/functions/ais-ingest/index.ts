import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Move vessel position forward based on speed/heading/elapsed time
function advancePosition(
  lat: number,
  lon: number,
  headingDeg: number,
  speedKn: number,
  elapsedHours: number
): { lat: number; lon: number } {
  const headingRad = (headingDeg * Math.PI) / 180;
  const distanceNm = speedKn * elapsedHours;
  const dLat = (distanceNm * Math.cos(headingRad)) / 60;
  const dLon = (distanceNm * Math.sin(headingRad)) / (60 * Math.cos((lat * Math.PI) / 180));
  const noise = () => (Math.random() - 0.5) * 0.001; // ±0.001° realistic AIS noise
  return {
    lat: parseFloat((lat + dLat + noise()).toFixed(6)),
    lon: parseFloat((lon + dLon + noise()).toFixed(6)),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const now = new Date();

  // Fetch all vessels
  const { data: vessels, error: fetchErr } = await supabase
    .from("vessels")
    .select("id, name, last_position_lat, last_position_lon, last_position_at, last_speed, last_heading, last_status, destination, eta, ais_gaps_24h");

  if (fetchErr || !vessels) {
    return new Response(JSON.stringify({ error: fetchErr?.message ?? "No vessels" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const vesselUpdates: Record<string, unknown>[] = [];
  const positionRows: Record<string, unknown>[] = [];

  for (const v of vessels) {
    const isMoored = !v.last_speed || parseFloat(v.last_speed) < 0.5 || v.last_status === "Moored";
    const lat = parseFloat(v.last_position_lat);
    const lon = parseFloat(v.last_position_lon);
    const lastAt = v.last_position_at ? new Date(v.last_position_at) : null;
    const elapsedHours = lastAt ? (now.getTime() - lastAt.getTime()) / 3_600_000 : 0;

    // Cap to 10 minutes of movement to avoid big jumps on first run
    const cappedHours = Math.min(elapsedHours, 10 / 60);

    let newLat = lat;
    let newLon = lon;
    let newSpeed = parseFloat(v.last_speed ?? "0");

    if (!isMoored && cappedHours > 0) {
      const pos = advancePosition(lat, lon, v.last_heading ?? 0, newSpeed, cappedHours);
      newLat = pos.lat;
      newLon = pos.lon;
      // Vary speed slightly (±0.3 kn) for realism
      newSpeed = parseFloat(Math.max(0, newSpeed + (Math.random() - 0.5) * 0.6).toFixed(2));
    }

    // Flag an AIS gap if we haven't heard from this vessel in >20 min
    const minutesSinceLast = lastAt ? (now.getTime() - lastAt.getTime()) / 60_000 : 0;
    const newGaps = (v.ais_gaps_24h ?? 0) + (minutesSinceLast > 20 ? 1 : 0);

    vesselUpdates.push({
      id: v.id,
      last_position_lat: newLat,
      last_position_lon: newLon,
      last_position_at: now.toISOString(),
      last_speed: newSpeed,
      ais_gaps_24h: newGaps,
    });

    positionRows.push({
      vessel_id: v.id,
      lat: newLat,
      lon: newLon,
      speed: newSpeed,
      heading: v.last_heading ?? 0,
      status: v.last_status ?? "Under way using engine",
      recorded_at: now.toISOString(),
      source: "simulated",
    });
  }

  // Update each vessel
  const updateErrors: string[] = [];
  await Promise.all(
    vesselUpdates.map(async ({ id, ...fields }) => {
      const { error } = await supabase.from("vessels").update(fields).eq("id", id);
      if (error) updateErrors.push(`${id}: ${error.message}`);
    })
  );

  // Bulk-insert position history
  const { error: insertErr } = await supabase.from("vessel_positions").insert(positionRows);

  return new Response(
    JSON.stringify({
      ok: true,
      timestamp: now.toISOString(),
      vessels_updated: vesselUpdates.length,
      positions_logged: positionRows.length,
      errors: updateErrors.length || insertErr ? { updates: updateErrors, history: insertErr?.message } : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

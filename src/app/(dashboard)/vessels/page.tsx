import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";
import { RemoveVesselButton } from "@/components/RemoveVesselButton";

export const dynamic = "force-dynamic";

interface VesselRow {
  id: string;
  imo: string | null;
  mmsi: string | null;
  name: string | null;
  type: string | null;
  flag: string | null;
  last_position_lat: number | null;
  last_position_lon: number | null;
  last_position_at: string | null;
  last_speed: number | null;
  last_heading: number | null;
  last_status: string | null;
  destination: string | null;
  eta: string | null;
  ais_gaps_24h: number | null;
}

function statusDotColor(vessel: VesselRow): string {
  if ((vessel.ais_gaps_24h ?? 0) > 0) return "bg-crimson";
  const s = (vessel.last_status ?? "").toLowerCase();
  if (s === "moored" || s === "at anchor" || s.includes("arriv")) return "bg-emerald";
  return "bg-amber";
}

function statusLabel(vessel: VesselRow): string {
  const s = (vessel.last_status ?? "").toLowerCase();
  if (!s || s === "undefined") return "Unknown";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function VesselsPage() {
  let vessels: VesselRow[] = [];
  let fetchError: string | null = null;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase env vars not set");
    const supabase = createClient(url, key);

    const { data, error } = await supabase
      .from("vessels")
      .select(
        "id, imo, mmsi, name, type, flag, last_position_lat, last_position_lon, last_position_at, last_speed, last_heading, last_status, destination, eta, ais_gaps_24h"
      )
      .order("last_position_at", { ascending: false });

    if (error) {
      fetchError = error.message;
    } else {
      vessels = (data ?? []) as VesselRow[];
    }
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error";
  }

  const atSea = vessels.filter((v) => {
    const s = (v.last_status ?? "").toLowerCase();
    return s.includes("under way") || s === "in_transit";
  });
  const withExceptions = vessels.filter((v) => (v.ais_gaps_24h ?? 0) > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-1">
          / VESSELS
        </div>
        <h1 className="font-display text-3xl tracking-tight">Fleet</h1>
      </div>

      {fetchError && (
        <div className="border border-crimson/30 bg-crimson/5 px-5 py-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-crimson mb-1">
            Data error
          </div>
          <div className="font-mono text-[11px] text-ink-300">{fetchError}</div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-px bg-ink-600/30 border border-ink-600/30">
        {[
          { label: "Total tracked", value: String(vessels.length), sub: "vessels" },
          { label: "At sea", value: String(atSea.length), sub: "underway" },
          {
            label: "With exceptions",
            value: String(withExceptions.length),
            sub: "needs review",
            danger: withExceptions.length > 0,
          },
        ].map((k) => (
          <div key={k.label} className="bg-ink-800/60 px-5 py-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-2">
              {k.label}
            </div>
            <div
              className={cn(
                "font-display text-3xl text-tabular",
                "danger" in k && k.danger ? "text-crimson" : "text-amber"
              )}
            >
              {k.value}
            </div>
            <div className="font-mono text-[10px] text-ink-500 uppercase tracking-wider mt-1">
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {vessels.length === 0 && !fetchError ? (
        <div className="flex flex-col items-center justify-center py-24 border border-ink-600/30">
          <div className="font-mono text-[11px] text-ink-400 text-center">
            No vessels tracked yet — use ⌘K on the map to add one
          </div>
        </div>
      ) : (
        <div className="border border-ink-600/30">
          {/* Column headers */}
          <div className="grid grid-cols-[20px_1fr_140px_80px_160px_110px_90px] gap-4 px-5 py-2.5 border-b border-ink-600/40 bg-ink-800/40">
            {["", "Vessel", "Type / Flag", "Speed", "Destination", "Last seen", ""].map(
              (col, i) => (
                <div
                  key={i}
                  className="font-mono text-[10px] uppercase tracking-wider text-ink-400"
                >
                  {col}
                </div>
              )
            )}
          </div>

          {/* Rows */}
          {vessels.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[20px_1fr_140px_80px_160px_110px_90px] gap-4 items-center px-5 py-3 border-b border-ink-600/40 hover:bg-ink-700/20 transition-colors"
            >
              {/* Status dot */}
              <div className="flex items-center justify-center">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    statusDotColor(v)
                  )}
                />
              </div>

              {/* Name + MMSI */}
              <div className="min-w-0">
                <div className="font-mono text-sm text-white truncate">
                  {v.name ?? `MMSI ${v.mmsi}`}
                </div>
                <div className="font-mono text-[10px] text-ink-400 mt-0.5">
                  {v.mmsi ?? v.imo ?? "—"}
                </div>
              </div>

              {/* Type / Flag */}
              <div>
                <div className="font-mono text-[11px] text-ink-300 truncate">
                  {v.type ?? "—"}
                </div>
                <div className="font-mono text-[10px] text-ink-500 mt-0.5">
                  {v.flag ?? "—"}
                </div>
              </div>

              {/* Speed */}
              <div className="font-mono text-[11px] text-tabular text-ink-200">
                {v.last_speed != null ? (
                  <>
                    <span className="text-white">{v.last_speed.toFixed(1)}</span>
                    <span className="text-ink-500"> kn</span>
                  </>
                ) : (
                  <span className="text-ink-500">—</span>
                )}
              </div>

              {/* Destination */}
              <div className="font-mono text-[11px] text-ink-300 truncate">
                {v.destination ?? statusLabel(v)}
              </div>

              {/* Last seen */}
              <div className="font-mono text-[11px] text-ink-400">
                {v.last_position_at ? relativeTime(v.last_position_at) : "—"}
              </div>

              {/* Remove */}
              <div className="flex justify-end">
                <RemoveVesselButton id={v.id} name={v.name ?? v.mmsi ?? "vessel"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

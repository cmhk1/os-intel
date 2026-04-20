import { createClient } from "@/lib/supabase/server";
import { Ship, MapPin } from "lucide-react";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VesselsPage() {
  const supabase = await createClient();
  const { data: vessels } = await supabase
    .from("vessels")
    .select("*")
    .order("last_position_at", { ascending: false });

  return (
    <div className="p-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
          / VESSELS
        </div>
        <h1 className="font-display text-4xl tracking-tight">Fleet</h1>
        <p className="text-ink-300 mt-2 text-sm">
          Live AIS data across tracked vessels. Connect MarineTraffic, Datalastic,
          or AISHub for real-time feeds.
        </p>
      </div>

      {/* Fake map area */}
      <div className="relative bg-ink-800 border border-ink-600/60 h-80 mb-6 overflow-hidden grid-lines">
        <div className="absolute inset-0 bg-gradient-to-br from-azure/5 via-transparent to-amber/5" />
        <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-wider text-ink-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
          AIS stream · {vessels?.length || 0} vessels
        </div>
        {/* Fake vessel dots */}
        {(vessels || []).map((v, i) => {
          // Project lat/lon to px (simple equirectangular)
          const x = ((Number(v.last_position_lon) + 180) / 360) * 100;
          const y = ((90 - Number(v.last_position_lat)) / 180) * 100;
          return (
            <div
              key={v.id}
              className="absolute group cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_12px_#f5a524] animate-pulse" />
              <div className="absolute left-4 top-0 bg-ink-900/95 border border-ink-500 px-2 py-1 text-[10px] font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                {v.name} · {v.last_speed}kn
              </div>
            </div>
          );
        })}
        <div className="absolute bottom-4 right-4 font-mono text-[10px] text-ink-400">
          demo map — integrate MarineTraffic/Datalastic for production
        </div>
      </div>

      {/* Table */}
      <div className="bg-ink-800/50 border border-ink-600/60">
        <div className="grid grid-cols-[1fr_100px_120px_90px_90px_1fr_110px] gap-3 px-5 py-2.5 border-b border-ink-600/60 bg-ink-700/30 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          <div>Vessel</div>
          <div>IMO</div>
          <div>Type</div>
          <div className="text-right">Speed</div>
          <div className="text-right">Heading</div>
          <div>Destination</div>
          <div className="text-right">Updated</div>
        </div>
        <div className="divide-y divide-ink-600/40">
          {(vessels || []).map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[1fr_100px_120px_90px_90px_1fr_110px] gap-3 px-5 py-3 hover:bg-ink-700/40 transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Ship className="w-3.5 h-3.5 text-amber shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm truncate">{v.name}</div>
                  <div className="font-mono text-[10px] text-ink-400 truncate">
                    {v.flag} · {v.operator}
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs text-ink-300">{v.imo}</div>
              <div className="text-xs text-ink-300 truncate">{v.type}</div>
              <div className="text-right font-mono text-sm text-tabular">
                {v.last_speed ? `${v.last_speed}` : "—"}
              </div>
              <div className="text-right font-mono text-sm text-tabular">
                {v.last_heading ? `${v.last_heading}°` : "—"}
              </div>
              <div className="flex items-center gap-1.5 text-xs truncate">
                <MapPin className="w-3 h-3 text-ink-400 shrink-0" />
                {v.destination || "—"}
              </div>
              <div className="text-right font-mono text-[10px] text-ink-400">
                {relativeTime(v.last_position_at)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

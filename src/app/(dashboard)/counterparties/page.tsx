import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const typeColors: Record<string, string> = {
  buyer: "text-azure border-azure-muted",
  seller: "text-emerald border-emerald-muted",
  bank: "text-amber border-amber-muted",
  surveyor: "text-ink-200 border-ink-400",
  broker: "text-ink-300 border-ink-500",
  insurer: "text-ink-200 border-ink-400",
};

export default async function CounterpartiesPage() {
  const supabase = await createClient();
  const { data: cps } = await supabase
    .from("counterparties")
    .select("*")
    .order("name");

  return (
    <div className="p-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
          / COUNTERPARTIES
        </div>
        <h1 className="font-display text-4xl tracking-tight">Network</h1>
        <p className="text-ink-300 mt-2 text-sm">
          Buyers, sellers, banks, surveyors, brokers. Risk-scored and
          sanctions-screened.
        </p>
      </div>

      <div className="bg-ink-800/50 border border-ink-600/60">
        <div className="grid grid-cols-[1fr_90px_80px_1fr_90px_100px] gap-3 px-5 py-2.5 border-b border-ink-600/60 bg-ink-700/30 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          <div>Name</div>
          <div>Type</div>
          <div>Country</div>
          <div>LEI / Tax ID</div>
          <div className="text-right">Risk</div>
          <div>Sanctions</div>
        </div>
        <div className="divide-y divide-ink-600/40">
          {(cps || []).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_90px_80px_1fr_90px_100px] gap-3 px-5 py-3 hover:bg-ink-700/40 transition items-center"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-ink-700 border border-ink-500 rounded-sm flex items-center justify-center text-[10px] font-mono text-ink-300">
                  {c.name[0]}
                </div>
                <span className="text-sm">{c.name}</span>
              </div>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase px-1.5 py-0.5 border inline-block text-center",
                  typeColors[c.type] || "text-ink-300 border-ink-500"
                )}
              >
                {c.type}
              </span>
              <span className="font-mono text-xs text-ink-300">{c.country}</span>
              <span className="font-mono text-[11px] text-ink-400 truncate">
                {c.lei || c.tax_id || "—"}
              </span>
              <span
                className={cn(
                  "text-right font-mono text-sm text-tabular",
                  (c.risk_score || 0) >= 60
                    ? "text-crimson"
                    : (c.risk_score || 0) >= 30
                    ? "text-amber"
                    : "text-emerald"
                )}
              >
                {c.risk_score ?? "—"}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase px-1.5 py-0.5 border inline-block text-center",
                  c.sanctions_status === "clear"
                    ? "text-emerald border-emerald-muted"
                    : c.sanctions_status === "flagged"
                    ? "text-amber border-amber-muted"
                    : c.sanctions_status === "sanctioned"
                    ? "text-crimson border-crimson-muted"
                    : "text-ink-400 border-ink-500"
                )}
              >
                {c.sanctions_status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

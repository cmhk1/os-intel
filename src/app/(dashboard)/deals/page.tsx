import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowUpRight, Filter } from "lucide-react";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  draft: "text-ink-300 bg-ink-600/40 border-ink-500",
  contracted: "text-azure bg-azure-muted/20 border-azure-muted/50",
  loading: "text-amber bg-amber-dim/30 border-amber-muted/50",
  in_transit: "text-amber-bright bg-amber-dim/40 border-amber-muted",
  discharged: "text-emerald bg-emerald-muted/30 border-emerald-muted",
  settled: "text-emerald bg-emerald-muted/40 border-emerald-muted",
  disputed: "text-crimson bg-crimson-muted/30 border-crimson-muted",
  cancelled: "text-ink-400 bg-ink-700 border-ink-500",
};

export default async function DealsPage() {
  const supabase = await createClient();
  const { data: deals } = await supabase
    .from("deals")
    .select(
      "id, deal_ref, status, commodity, grade, quantity, unit, price, currency, incoterm, load_port, discharge_port, laycan_start, laycan_end, ai_risk_score, vessels(name, imo), buyer:counterparties!buyer_id(name), seller:counterparties!seller_id(name)"
    )
    .order("updated_at", { ascending: false });

  const grouped: Record<string, any[]> = {};
  (deals || []).forEach((d: any) => {
    if (!grouped[d.status]) grouped[d.status] = [];
    grouped[d.status].push(d);
  });

  const order = ["loading", "in_transit", "contracted", "discharged", "disputed", "draft", "settled", "cancelled"];

  return (
    <div className="p-8 max-w-[1600px]">
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
            / DEALS
          </div>
          <h1 className="font-display text-4xl tracking-tight">Book</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="border border-ink-500 px-3 py-2 text-sm hover:border-amber hover:text-amber transition flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <Link
            href="/deals/new"
            className="bg-amber text-ink-900 px-4 py-2 text-sm font-medium hover:bg-amber-bright transition flex items-center gap-1.5"
          >
            New deal <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-ink-800/50 border border-ink-600/60">
        <div className="grid grid-cols-[110px_120px_1fr_120px_1fr_130px_130px_60px] gap-3 px-5 py-2.5 border-b border-ink-600/60 bg-ink-700/30 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          <div>Status</div>
          <div>Ref</div>
          <div>Commodity</div>
          <div>Inco</div>
          <div>Route</div>
          <div className="text-right">Quantity</div>
          <div className="text-right">Value</div>
          <div className="text-right">Risk</div>
        </div>

        {order.map((status) => {
          const rows = grouped[status];
          if (!rows || rows.length === 0) return null;
          return (
            <div key={status}>
              <div className="px-5 py-2 bg-ink-700/20 font-mono text-[10px] uppercase tracking-wider text-ink-300 flex items-center gap-2">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    statusStyles[status]?.includes("amber")
                      ? "bg-amber"
                      : statusStyles[status]?.includes("emerald")
                      ? "bg-emerald"
                      : statusStyles[status]?.includes("crimson")
                      ? "bg-crimson"
                      : statusStyles[status]?.includes("azure")
                      ? "bg-azure"
                      : "bg-ink-400"
                  )}
                />
                {status.replace("_", " ")}
                <span className="ml-auto text-ink-400">{rows.length}</span>
              </div>
              <div className="divide-y divide-ink-600/40">
                {rows.map((d: any) => (
                  <Link
                    key={d.id}
                    href={`/deals/${d.id}`}
                    className="grid grid-cols-[110px_120px_1fr_120px_1fr_130px_130px_60px] gap-3 px-5 py-3 hover:bg-ink-700/40 transition items-center"
                  >
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase px-1.5 py-0.5 border tracking-wider text-center",
                        statusStyles[d.status]
                      )}
                    >
                      {d.status.replace("_", " ")}
                    </span>
                    <span className="font-mono text-sm text-white">{d.deal_ref}</span>
                    <div className="min-w-0">
                      <div className="text-sm truncate">
                        {d.commodity} · <span className="text-ink-300">{d.grade}</span>
                      </div>
                      <div className="text-[11px] text-ink-400 font-mono truncate">
                        {d.buyer?.name} ← {d.seller?.name}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-ink-300">{d.incoterm}</span>
                    <div className="text-[12px] font-mono truncate">
                      <span className="text-ink-200">{d.load_port}</span>
                      <span className="text-ink-400"> → </span>
                      <span className="text-ink-200">{d.discharge_port}</span>
                    </div>
                    <div className="text-right font-mono text-sm text-tabular">
                      {formatCompact(d.quantity)}{" "}
                      <span className="text-ink-400 text-[11px]">{d.unit}</span>
                    </div>
                    <div className="text-right font-mono text-sm text-tabular">
                      {formatCurrency(
                        Number(d.price || 0) * Number(d.quantity || 0),
                        d.currency || "USD"
                      )}
                    </div>
                    <div
                      className={cn(
                        "text-right font-mono text-sm text-tabular",
                        (d.ai_risk_score || 0) >= 60
                          ? "text-crimson"
                          : (d.ai_risk_score || 0) >= 30
                          ? "text-amber"
                          : "text-emerald"
                      )}
                    >
                      {d.ai_risk_score ?? "—"}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {(!deals || deals.length === 0) && (
          <div className="px-5 py-16 text-center text-ink-400 text-sm">
            No deals in the book.
          </div>
        )}
      </div>
    </div>
  );
}

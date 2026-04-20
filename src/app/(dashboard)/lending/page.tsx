import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { cn, formatCurrency, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LendingPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("lending_requests")
    .select("*, deals(deal_ref, commodity, load_port, discharge_port, vessels(name))")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
          / LENDING
        </div>
        <h1 className="font-display text-4xl tracking-tight">Financing space</h1>
        <p className="text-ink-300 mt-2 text-sm">
          Open trade finance requests. Lenders see every deal with AI risk score,
          vessel position, document completeness, and settlement triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {(requests || []).map((r: any) => {
          const notional = Number(r.amount || 0);
          return (
            <Link
              key={r.id}
              href={`/deals/${r.deal_id}`}
              className="bg-ink-800/50 border border-ink-600/60 hover:border-amber/50 transition p-5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase px-1.5 py-0.5 border",
                        r.status === "open"
                          ? "text-amber border-amber-muted"
                          : r.status === "quoted"
                          ? "text-azure border-azure-muted"
                          : r.status === "funded"
                          ? "text-emerald border-emerald-muted"
                          : "text-ink-400 border-ink-500"
                      )}
                    >
                      {r.status}
                    </span>
                    <span className="font-mono text-xs text-amber">
                      {r.deals?.deal_ref}
                    </span>
                  </div>
                  <div className="font-display text-2xl mt-2 group-hover:text-amber transition">
                    {r.deals?.commodity}
                  </div>
                  <div className="font-mono text-xs text-ink-300 mt-1">
                    {r.deals?.load_port} → {r.deals?.discharge_port}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase text-ink-400">
                    Ask
                  </div>
                  <div className="font-display text-3xl text-amber text-tabular">
                    {formatCurrency(notional, r.currency)}
                  </div>
                  <div className="font-mono text-[10px] text-ink-400 mt-1">
                    {r.tenor_days}d tenor
                  </div>
                </div>
              </div>

              <div className="border-t border-ink-600/60 pt-3 text-xs text-ink-300 flex items-center justify-between">
                <span>{r.purpose}</span>
                <span className="font-mono text-[10px] text-ink-400">
                  {relativeTime(r.created_at)}
                </span>
              </div>
            </Link>
          );
        })}
        {(!requests || requests.length === 0) && (
          <div className="col-span-full bg-ink-800/50 border border-ink-600/60 p-16 text-center text-ink-400 text-sm">
            No open financing requests.
          </div>
        )}
      </div>

      <div className="mt-8 bg-amber-dim/10 border-l-2 border-amber p-5">
        <div className="font-mono text-[10px] uppercase tracking-wider text-amber mb-2 flex items-center gap-2">
          <TrendingUp className="w-3 h-3" />
          Next: lender onboarding
        </div>
        <p className="text-sm text-ink-200 max-w-3xl">
          This is the v0 pull-factor surface. Next: lender-side dashboard, automated
          risk packet (AI-scored deal + document pack + vessel status), programmable
          escrow release from funded pool, and post-trade reporting. The financing
          events become part of the proprietary outcome dataset.
        </p>
      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Ship,
  ArrowUpRight,
  GitBranch,
  Circle,
} from "lucide-react";
import { cn, formatCompact, formatCurrency, relativeTime } from "@/lib/utils";

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

const severityStyles: Record<string, string> = {
  info: "text-ink-300",
  warn: "text-amber",
  error: "text-crimson",
  critical: "text-crimson",
};

export default async function DashboardPage() {
  let deals: any[] = [], events: any[] = [], triggers: any[] = [], vessels: any[] = [];

  try {
    const supabase = await createClient();
    const [d, e, t, v] = await Promise.all([
      supabase
        .from("deals")
        .select(
          "id, deal_ref, status, commodity, grade, quantity, unit, price, currency, load_port, discharge_port, ai_risk_score, ai_summary, eta, vessel_id, vessels(name, imo, last_position_lat, last_position_lon), buyer:counterparties!buyer_id(name), seller:counterparties!seller_id(name)"
        )
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("events")
        .select("id, event_type, source, severity, payload, occurred_at, deals(deal_ref)")
        .order("occurred_at", { ascending: false })
        .limit(8),
      supabase
        .from("triggers")
        .select("id, name, status, action, deals(deal_ref)")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("vessels")
        .select("id, name, imo, last_position_lat, last_position_lon, last_speed, destination, eta, last_status, last_position_at")
        .order("last_position_at", { ascending: false })
        .limit(6),
    ]);
    deals = d.data || [];
    events = e.data || [];
    triggers = t.data || [];
    vessels = v.data || [];
  } catch {
    // Supabase unavailable — render empty state
  }

  const activeDeals = (deals || []).filter(
    (d) => !["settled", "cancelled"].includes(d.status)
  );
  const tvlUsd = (deals || []).reduce(
    (sum, d) => sum + (Number(d.price || 0) * Number(d.quantity || 0)),
    0
  );
  const flagged = (deals || []).filter((d) => (d.ai_risk_score || 0) >= 60).length;
  const armedTriggers = (triggers || []).filter((t) => t.status === "armed").length;

  return (
    <div className="p-8 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
            / TERMINAL
          </div>
          <h1 className="font-display text-4xl tracking-tight">Overview</h1>
        </div>
        <Link
          href="/deals/new"
          className="bg-amber text-ink-900 px-4 py-2 text-sm font-medium hover:bg-amber-bright transition flex items-center gap-1.5"
        >
          New deal <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-px bg-ink-600/60 border border-ink-600/60 mb-8">
        <KPI label="Active deals" value={activeDeals.length.toString()} sub={`${deals?.length || 0} total`} />
        <KPI
          label="Notional"
          value={`$${formatCompact(tvlUsd)}`}
          sub="gross value"
          accent
        />
        <KPI label="Flagged" value={flagged.toString()} sub="risk ≥ 60" danger={flagged > 0} />
        <KPI label="Armed triggers" value={armedTriggers.toString()} sub="awaiting events" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Deals (wider) */}
        <section className="col-span-2 bg-ink-800/50 border border-ink-600/60">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink-600/60">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-amber" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Deals
              </span>
            </div>
            <Link
              href="/deals"
              className="text-[11px] text-ink-400 hover:text-amber transition flex items-center gap-1"
            >
              All deals <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-ink-600/40">
            {(deals || []).map((d: any) => (
              <Link
                key={d.id}
                href={`/deals/${d.id}`}
                className="block px-5 py-4 hover:bg-ink-700/40 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Status pill */}
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase px-1.5 py-0.5 border tracking-wider min-w-[90px] text-center",
                      statusStyles[d.status] || statusStyles.draft
                    )}
                  >
                    {d.status.replace("_", " ")}
                  </span>

                  {/* Ref + commodity */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">
                        {d.deal_ref}
                      </span>
                      <span className="text-sm text-ink-300 truncate">
                        {d.commodity} · {d.grade}
                      </span>
                    </div>
                    <div className="text-[11px] text-ink-400 mt-0.5 font-mono">
                      {d.load_port} → {d.discharge_port}
                      {d.vessels?.name ? ` · ${d.vessels.name}` : ""}
                    </div>
                  </div>

                  {/* Notional */}
                  <div className="text-right">
                    <div className="font-mono text-sm text-tabular">
                      {formatCurrency(
                        Number(d.price || 0) * Number(d.quantity || 0),
                        d.currency || "USD"
                      )}
                    </div>
                    <div className="text-[11px] text-ink-400 font-mono">
                      {formatCompact(d.quantity)} {d.unit}
                    </div>
                  </div>

                  {/* Risk */}
                  <div className="w-14 text-center">
                    <div
                      className={cn(
                        "font-mono text-sm text-tabular",
                        (d.ai_risk_score || 0) >= 60
                          ? "text-crimson"
                          : (d.ai_risk_score || 0) >= 30
                          ? "text-amber"
                          : "text-emerald"
                      )}
                    >
                      {d.ai_risk_score ?? "—"}
                    </div>
                    <div className="text-[10px] text-ink-400 font-mono">RISK</div>
                  </div>
                </div>
              </Link>
            ))}
            {(!deals || deals.length === 0) && (
              <div className="px-5 py-12 text-center text-ink-400 text-sm">
                No deals yet. <Link href="/deals/new" className="text-amber">Create one</Link>.
              </div>
            )}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          {/* Event stream */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-ink-600/60">
              <Circle className="w-2 h-2 fill-emerald text-emerald animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">
                Event stream
              </span>
            </div>
            <div className="divide-y divide-ink-600/40 text-[12px] font-mono">
              {(events || []).map((e: any) => (
                <div key={e.id} className="px-5 py-2.5 flex items-start gap-3">
                  <span
                    className={cn(
                      "shrink-0 mt-1 w-1.5 h-1.5 rounded-full",
                      e.severity === "critical" || e.severity === "error"
                        ? "bg-crimson"
                        : e.severity === "warn"
                        ? "bg-amber"
                        : "bg-ink-400"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "truncate",
                        severityStyles[e.severity] || "text-ink-200"
                      )}
                    >
                      {e.event_type}
                    </div>
                    <div className="text-[10px] text-ink-400 flex items-center gap-2 mt-0.5">
                      <span>{e.deals?.deal_ref || "—"}</span>
                      <span>·</span>
                      <span>{e.source}</span>
                      <span>·</span>
                      <span>{relativeTime(e.occurred_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Vessels */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="flex items-center justify-between px-5 py-3 border-b border-ink-600/60">
              <div className="flex items-center gap-2">
                <Ship className="w-3.5 h-3.5 text-amber" />
                <span className="font-mono text-[11px] uppercase tracking-wider">
                  Fleet
                </span>
              </div>
              <Link
                href="/vessels"
                className="text-[11px] text-ink-400 hover:text-amber transition"
              >
                All →
              </Link>
            </div>
            <div className="divide-y divide-ink-600/40">
              {(vessels || []).slice(0, 4).map((v: any) => (
                <div key={v.id} className="px-5 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate">{v.name}</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-400">
                      {v.last_speed ? `${v.last_speed}kn` : "—"}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-400 font-mono mt-0.5">
                    → {v.destination || "—"} · ETA{" "}
                    {v.eta
                      ? new Date(v.eta).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function KPI({
  label,
  value,
  sub,
  accent,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="bg-ink p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-4xl text-tabular",
          accent && "text-amber",
          danger && "text-crimson"
        )}
      >
        {value}
      </div>
      {sub && (
        <div className="font-mono text-[10px] text-ink-400 uppercase tracking-wider mt-1">
          {sub}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import {
  Ship,
  ArrowUpRight,
  GitBranch,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  in_transit: "text-amber-bright bg-amber-dim/40 border-amber-muted",
  loading: "text-amber bg-amber-dim/30 border-amber-muted/50",
  contracted: "text-azure bg-azure-muted/20 border-azure-muted/50",
};

const MOCK_DEALS = [
  {
    id: "1", deal_ref: "OIL-2026-0142", status: "in_transit",
    commodity: "Arab Light", grade: "API 33",
    quantity: 2000000, unit: "BBL", price: 79.45, currency: "USD",
    load_port: "RAS TANURA", discharge_port: "FUJAIRAH",
    ai_risk_score: 72,
    vessels: { name: "SEAWAYS ENDEAVOR" },
  },
  {
    id: "2", deal_ref: "OIL-2026-0143", status: "loading",
    commodity: "Upper Zakum", grade: "API 40",
    quantity: 1000000, unit: "BBL", price: 81.20, currency: "USD",
    load_port: "DAS ISLAND", discharge_port: "SINGAPORE",
    ai_risk_score: 18,
    vessels: { name: "NEW ADVANCE" },
  },
  {
    id: "3", deal_ref: "OIL-2026-0144", status: "contracted",
    commodity: "Kuwait Export", grade: "API 31",
    quantity: 1200000, unit: "BBL", price: 77.30, currency: "USD",
    load_port: "MINA AL AHMADI", discharge_port: "CHIBA",
    ai_risk_score: 12,
    vessels: { name: "EAGLE BOSTON" },
  },
];

const MOCK_EVENTS = [
  { id: "e1", event_type: "AIS gap — SEAWAYS ENDEAVOR", source: "VesselAgent", severity: "error", deals: { deal_ref: "OIL-2026-0142" }, occurred_at: "2m ago" },
  { id: "e2", event_type: "B/L parsed and matched", source: "DocumentAgent", severity: "info", deals: { deal_ref: "OIL-2026-0143" }, occurred_at: "4m ago" },
  { id: "e3", event_type: "Counterparty flagged", source: "ComplianceAgent", severity: "warn", deals: { deal_ref: "OIL-2026-0142" }, occurred_at: "8m ago" },
  { id: "e4", event_type: "LC issuance confirmed", source: "FinanceAgent", severity: "info", deals: { deal_ref: "OIL-2026-0142" }, occurred_at: "23m ago" },
  { id: "e5", event_type: "Laycan tightened +12h", source: "LogisticsAgent", severity: "info", deals: { deal_ref: "OIL-2026-0143" }, occurred_at: "31m ago" },
];

const MOCK_VESSELS = [
  { id: "v1", name: "SEAWAYS ENDEAVOR", last_speed: "12.4", destination: "FUJAIRAH", eta: null },
  { id: "v2", name: "NEW ADVANCE", last_speed: "14.1", destination: "SINGAPORE", eta: null },
  { id: "v3", name: "EAGLE BOSTON", last_speed: "11.8", destination: "CHIBA", eta: null },
];

const severityStyles: Record<string, string> = {
  info: "text-ink-300",
  warn: "text-amber",
  error: "text-crimson",
  critical: "text-crimson",
};

export default function DashboardPage() {
  const activeDeals = MOCK_DEALS.filter((d) => !["settled", "cancelled"].includes(d.status));
  const tvlUsd = MOCK_DEALS.reduce((sum, d) => sum + d.price * d.quantity, 0);
  const flagged = MOCK_DEALS.filter((d) => d.ai_risk_score >= 60).length;

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
          href="/deals"
          className="bg-amber text-ink-900 px-4 py-2 text-sm font-medium hover:bg-amber-bright transition flex items-center gap-1.5"
        >
          New deal <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-px bg-ink-600/60 border border-ink-600/60 mb-8">
        <KPI label="Active deals" value={activeDeals.length.toString()} sub={`${MOCK_DEALS.length} total`} />
        <KPI label="Notional" value={`$${(tvlUsd / 1e6).toFixed(0)}M`} sub="gross value" accent />
        <KPI label="Flagged" value={flagged.toString()} sub="risk ≥ 60" danger={flagged > 0} />
        <KPI label="Armed triggers" value="4" sub="awaiting events" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Deals */}
        <section className="col-span-2 bg-ink-800/50 border border-ink-600/60">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink-600/60">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-amber" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Deals</span>
            </div>
            <Link href="/deals" className="text-[11px] text-ink-400 hover:text-amber transition flex items-center gap-1">
              All deals <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-ink-600/40">
            {MOCK_DEALS.map((d) => (
              <div key={d.id} className="block px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "font-mono text-[10px] uppercase px-1.5 py-0.5 border tracking-wider min-w-[90px] text-center",
                    statusStyles[d.status] || "text-ink-300 bg-ink-600/40 border-ink-500"
                  )}>
                    {d.status.replace("_", " ")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-white">{d.deal_ref}</span>
                      <span className="text-sm text-ink-300 truncate">{d.commodity} · {d.grade}</span>
                    </div>
                    <div className="text-[11px] text-ink-400 mt-0.5 font-mono">
                      {d.load_port} → {d.discharge_port}{d.vessels?.name ? ` · ${d.vessels.name}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-tabular">
                      ${((d.price * d.quantity) / 1e6).toFixed(1)}M
                    </div>
                    <div className="text-[11px] text-ink-400 font-mono">
                      {(d.quantity / 1e6).toFixed(1)}M {d.unit}
                    </div>
                  </div>
                  <div className="w-14 text-center">
                    <div className={cn(
                      "font-mono text-sm text-tabular",
                      d.ai_risk_score >= 60 ? "text-crimson" : d.ai_risk_score >= 30 ? "text-amber" : "text-emerald"
                    )}>
                      {d.ai_risk_score}
                    </div>
                    <div className="text-[10px] text-ink-400 font-mono">RISK</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right column */}
        <div className="space-y-6">
          {/* Event stream */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-ink-600/60">
              <Circle className="w-2 h-2 fill-emerald text-emerald animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider">Event stream</span>
            </div>
            <div className="divide-y divide-ink-600/40 text-[12px] font-mono">
              {MOCK_EVENTS.map((e) => (
                <div key={e.id} className="px-5 py-2.5 flex items-start gap-3">
                  <span className={cn(
                    "shrink-0 mt-1 w-1.5 h-1.5 rounded-full",
                    e.severity === "error" ? "bg-crimson" : e.severity === "warn" ? "bg-amber" : "bg-ink-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className={cn("truncate", severityStyles[e.severity] || "text-ink-200")}>
                      {e.event_type}
                    </div>
                    <div className="text-[10px] text-ink-400 flex items-center gap-2 mt-0.5">
                      <span>{e.deals?.deal_ref || "—"}</span>
                      <span>·</span>
                      <span>{e.source}</span>
                      <span>·</span>
                      <span>{e.occurred_at}</span>
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
                <span className="font-mono text-[11px] uppercase tracking-wider">Fleet</span>
              </div>
              <Link href="/vessels" className="text-[11px] text-ink-400 hover:text-amber transition">All →</Link>
            </div>
            <div className="divide-y divide-ink-600/40">
              {MOCK_VESSELS.map((v) => (
                <div key={v.id} className="px-5 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate">{v.name}</span>
                    <span className="ml-auto font-mono text-[11px] text-ink-400">
                      {v.last_speed ? `${v.last_speed}kn` : "—"}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-400 font-mono mt-0.5">
                    → {v.destination || "—"} · ETA —
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

function KPI({ label, value, sub, accent, danger }: {
  label: string; value: string; sub?: string; accent?: boolean; danger?: boolean;
}) {
  return (
    <div className="bg-ink p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">{label}</div>
      <div className={cn("font-display text-4xl text-tabular", accent && "text-amber", danger && "text-crimson")}>
        {value}
      </div>
      {sub && <div className="font-mono text-[10px] text-ink-400 uppercase tracking-wider mt-1">{sub}</div>}
    </div>
  );
}

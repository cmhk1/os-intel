"use client";

import { useState } from "react";
import {
  Mail, FileText, Shield, Ship, Package, Truck,
  Banknote, CheckSquare, Users, TrendingUp, Bot,
  AlertTriangle, Clock, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Severity = "info" | "warn" | "error";
type AgentStatus = "working" | "idle" | "blocked";

interface Agent {
  id: string;
  name: string;
  icon: React.ElementType;
  status: AgentStatus;
  task: string;
  count: number;
}

interface FeedItem {
  id: string;
  agent: string;
  icon: React.ElementType;
  severity: Severity;
  time: string;
  action: string;
  body: string;
  dealRef: string;
  tags: string[];
  needsApproval?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
}

interface Exception {
  id: string;
  severity: Severity;
  title: string;
  context: string;
  description: string;
}

const AGENTS: Agent[] = [
  { id: "confirm", name: "Confirm Agent", icon: Mail, status: "working", task: "Parsing 2 inbound confirmations", count: 2 },
  { id: "document", name: "Document Agent", icon: FileText, status: "working", task: "Ingesting B/L + COA for OIL-0149", count: 5 },
  { id: "compliance", name: "Compliance Agent", icon: Shield, status: "blocked", task: "Awaiting approval — OIL-0146", count: 1 },
  { id: "vessel", name: "Vessel Agent", icon: Ship, status: "blocked", task: "AIS gap alert — OIL-0142", count: 1 },
  { id: "quality", name: "Quality Agent", icon: Package, status: "working", task: "COA cross-check 3 active deals", count: 3 },
  { id: "logistics", name: "Logistics Agent", icon: Truck, status: "working", task: "Monitoring demurrage exposure", count: 4 },
  { id: "finance", name: "Finance Agent", icon: Banknote, status: "working", task: "LC tracking 6 open instruments", count: 6 },
  { id: "settlement", name: "Settlement Agent", icon: CheckSquare, status: "idle", task: "1 deal settlement-ready", count: 1 },
  { id: "counterparty", name: "Counterparty Agent", icon: Users, status: "working", task: "Risk scoring 12 counterparties", count: 12 },
  { id: "pricing", name: "Pricing Agent", icon: TrendingUp, status: "working", task: "Monitoring Platts Dubai M+1", count: 8 },
];

const FEED: FeedItem[] = [
  {
    id: "f1", agent: "Confirm Agent", icon: Mail, severity: "info", time: "2m ago",
    action: "captured trade confirmation",
    body: "Email from olivia@sugarcorp.com · draft created for OIL-2026-0155 · buyer Trafigura Pte Ltd, Arab Light 1.5M BBL FOB Ras Tanura",
    dealRef: "OIL-2026-0155", tags: ["email-parsed", "draft"],
  },
  {
    id: "f2", agent: "Document Agent", icon: FileText, severity: "info", time: "4m ago",
    action: "parsed Bill of Lading",
    body: "All fields match contract. Vessel PACIFIC GRACE, cargo 2.1M BBL Arab Medium, shipper ADNOC Global Trading. No discrepancies found.",
    dealRef: "OIL-2026-0149", tags: ["bl-parsed", "matched"],
  },
  {
    id: "f3", agent: "Compliance Agent", icon: Shield, severity: "warn", time: "8m ago",
    action: "flagged counterparty",
    body: "Unregistered Broker Ltd added as sub-agent. Entity not on approved counterparty list. Sanctions check escalated — awaiting ops director sign-off.",
    dealRef: "OIL-2026-0146", tags: ["sanctions", "escalated"],
    needsApproval: true, approveLabel: "Approve", rejectLabel: "Reject",
  },
  {
    id: "f4", agent: "Vessel Agent", icon: Ship, severity: "error", time: "12m ago",
    action: "AIS gap detected",
    body: "SEAWAYS ENDEAVOR went dark — 6h silence on MMSI 538007623. Last position 25.8°N 55.1°E (Persian Gulf). Possible transponder fault or deviation.",
    dealRef: "OIL-2026-0142", tags: ["ais-gap", "escalated"],
    needsApproval: true, approveLabel: "Investigate", rejectLabel: "Snooze",
  },
  {
    id: "f5", agent: "Quality Agent", icon: Package, severity: "warn", time: "18m ago",
    action: "sulphur discrepancy",
    body: "Discharge COA shows sulphur 3.71% vs contractual 3.50%. Exceeds 0.15% tolerance. Dispute threshold met — claim draft prepared and awaiting review.",
    dealRef: "OIL-2026-0138", tags: ["spec-breach", "dispute"],
    needsApproval: true, approveLabel: "Open dispute", rejectLabel: "Waive",
  },
  {
    id: "f6", agent: "Finance Agent", icon: Banknote, severity: "info", time: "23m ago",
    action: "LC issuance confirmed",
    body: "ING Bank N.V. issued LC-2026-78431 for $158.9M. All terms match deal. Documents lodged. Payment window: 5 banking days from presentation.",
    dealRef: "OIL-2026-0142", tags: ["lc-issued"],
  },
  {
    id: "f7", agent: "Logistics Agent", icon: Truck, severity: "info", time: "31m ago",
    action: "laycan tightened",
    body: "Port congestion at Mina Al Ahmadi reduced. NEW ADVANCE laycan revised +12h. NOR window: Apr 28 06:00–18:00 LT. Berth booking confirmed.",
    dealRef: "OIL-2026-0143", tags: ["laycan", "updated"],
  },
  {
    id: "f8", agent: "Settlement Agent", icon: CheckSquare, severity: "info", time: "44m ago",
    action: "settlement ready",
    body: "All conditions satisfied — final invoice matched, documents in order, LC clean. Ready to trigger settlement rail for full release.",
    dealRef: "OIL-2026-0139", tags: ["settlement-ready"],
    needsApproval: true, approveLabel: "Release", rejectLabel: "Hold",
  },
  {
    id: "f9", agent: "Pricing Agent", icon: TrendingUp, severity: "info", time: "52m ago",
    action: "formula recalculated",
    body: "Platts Dubai M+1 updated. FRONT ALFA deal price revised to $79.82/BBL (was $79.45). Delta +$740K notional. Invoice amendment queued.",
    dealRef: "OIL-2026-0145", tags: ["platts", "repriced"],
  },
  {
    id: "f10", agent: "Counterparty Agent", icon: Users, severity: "info", time: "1h ago",
    action: "risk score improved",
    body: "Vitol S.A. risk score decreased from 12 → 10 following clean settlement of OIL-2026-0135. Credit line headroom increased by $42M.",
    dealRef: "OIL-2026-0135", tags: ["risk-score", "updated"],
  },
  {
    id: "f11", agent: "Confirm Agent", icon: Mail, severity: "info", time: "1h ago",
    action: "back-to-back matched",
    body: "Gunvor Group confirmation matches issued terms exactly. All commercial fields aligned. Contract generation triggered automatically.",
    dealRef: "OIL-2026-0150", tags: ["matched", "contract"],
  },
  {
    id: "f12", agent: "Document Agent", icon: FileText, severity: "warn", time: "2h ago",
    action: "invoice quantity mismatch",
    body: "Invoice quantity 1,990,000 BBL vs B/L 2,000,000 BBL. Discrepancy: 10,000 BBL (~$790K at current Platts). Payment held pending correction.",
    dealRef: "OIL-2026-0150", tags: ["invoice", "discrepancy"],
  },
  {
    id: "f13", agent: "Vessel Agent", icon: Ship, severity: "info", time: "2h ago",
    action: "ETA revised ahead",
    body: "EAGLE BOSTON increased speed to 13.5kn after Gulf anchorage cleared. ETA revised to May 11 (was May 12). Berth booking updated at Chiba.",
    dealRef: "OIL-2026-0144", tags: ["eta-revised"],
  },
  {
    id: "f14", agent: "Compliance Agent", icon: Shield, severity: "info", time: "3h ago",
    action: "sanctions screening clear",
    body: "Full OFAC + EU + UN sanctions check complete for HANA PIONEER voyage. All parties, flag state, and ports of call clear. Certificate generated.",
    dealRef: "OIL-2026-0153", tags: ["sanctions", "cleared"],
  },
  {
    id: "f15", agent: "Logistics Agent", icon: Truck, severity: "warn", time: "4h ago",
    action: "demurrage exposure rising",
    body: "MINERVA HELEN at Basra anchorage 18h waiting for berth. Expected additional delay 6–12h. Estimated exposure: $48K at $3,200/day charter rate.",
    dealRef: "OIL-2026-0150", tags: ["demurrage", "risk"],
  },
];

const EXCEPTIONS: Exception[] = [
  {
    id: "e1", severity: "error",
    title: "AIS gap — SEAWAYS ENDEAVOR",
    context: "OIL-2026-0142 · 6h silence",
    description: "Transponder dark since 14:23 UTC. Last position Persian Gulf. Gap exceeds 4h threshold. $158.9M LC open.",
  },
  {
    id: "e2", severity: "warn",
    title: "Sulphur breach — OIL-2026-0138",
    context: "3.71% discharge vs 3.50% contractual",
    description: "Discharge COA exceeds spec tolerance. Claim draft prepared. Awaiting approval to open formal dispute with Gunvor.",
  },
  {
    id: "e3", severity: "warn",
    title: "Unregistered counterparty",
    context: "OIL-2026-0146 · Unregistered Broker Ltd",
    description: "Sub-agent not on approved list. Sanctions escalation pending ops director sign-off before deal can proceed.",
  },
];

const severityBar: Record<Severity, string> = {
  info: "bg-ink-500",
  warn: "bg-amber",
  error: "bg-crimson",
};

const agentStatusDot: Record<AgentStatus, string> = {
  working: "bg-emerald",
  idle: "bg-amber",
  blocked: "bg-crimson",
};

const exceptionBorder: Record<Severity, string> = {
  info: "border-ink-600/60",
  warn: "border-amber-muted/50",
  error: "border-crimson-muted/50",
};

export default function AgentsPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [approved, setApproved] = useState<Set<string>>(new Set());

  const visibleFeed = FEED.filter((f) => !dismissed.has(f.id));
  const visibleExceptions = EXCEPTIONS.filter((e) => !dismissed.has(e.id));

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="px-4 sm:px-8 pt-5 sm:pt-8 pb-4 sm:pb-5 border-b border-ink-600/60">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">/ AGENTS</div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl tracking-tight">Operating system</h1>
            <p className="font-mono text-[11px] text-ink-300 mt-1.5">
              {AGENTS.length} agents running across 47 active trades. {visibleExceptions.length} exceptions waiting on you.
            </p>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            {AGENTS.filter((a) => a.status === "working").length} agents active
          </div>
        </div>
      </div>

      {/* Body — stacks on mobile, 3-column on lg+ */}
      <div className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden">

        {/* Left rail — agent list */}
        <aside className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-ink-600/60 lg:overflow-y-auto shrink-0">
          <div className="px-4 py-3 border-b border-ink-600/60">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">Agents</span>
          </div>
          <div className="divide-y divide-ink-600/30">
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="px-4 py-3 hover:bg-ink-700/40 transition-colors cursor-default">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", agentStatusDot[a.status])} />
                    <Icon className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                    <span className="font-mono text-[11px] text-white truncate">{a.name}</span>
                    <span className={cn(
                      "ml-auto font-mono text-[10px] px-1.5 py-0.5 border shrink-0",
                      a.status === "blocked"
                        ? "text-crimson border-crimson-muted/40 bg-crimson-muted/10"
                        : "text-ink-400 border-ink-600/40"
                    )}>{a.count}</span>
                  </div>
                  <div className="font-mono text-[10px] text-ink-500 pl-6 truncate">{a.task}</div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center — activity feed */}
        <main className="flex-1 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-ink-600/60">
          <div className="px-5 py-3 border-b border-ink-600/60 flex items-center justify-between sticky top-0 bg-ink/95 backdrop-blur z-10">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
              Activity · {visibleFeed.length} events
            </span>
            <span className="font-mono text-[10px] text-ink-500">newest first</span>
          </div>
          <div className="p-4 space-y-2">
            {visibleFeed.map((item) => {
              const Icon = item.icon;
              const isDone = approved.has(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-ink-800/50 border border-ink-600/60 flex overflow-hidden transition-opacity",
                    isDone && "opacity-60"
                  )}
                >
                  {/* Severity bar */}
                  <div className={cn("w-0.5 shrink-0", severityBar[item.severity])} />

                  <div className="flex-1 px-4 py-3 min-w-0">
                    {/* Top line */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Icon className="w-3 h-3 text-amber shrink-0" />
                      <span className="font-mono text-[11px] text-amber">{item.agent}</span>
                      <span className="font-mono text-[11px] text-ink-300">→ {item.action}</span>
                      <span className="ml-auto font-mono text-[10px] text-ink-500 shrink-0 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.time}
                      </span>
                    </div>

                    {/* Body */}
                    <p className="font-mono text-[11px] text-ink-300 leading-relaxed mb-2">{item.body}</p>

                    {/* Footer */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-amber">{item.dealRef}</span>
                      {item.tags.map((t) => (
                        <span key={t} className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-ink-600/60 text-ink-400 tracking-wider">
                          {t}
                        </span>
                      ))}
                      {item.needsApproval && !isDone && (
                        <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 border border-amber-muted/50 text-amber bg-amber-dim/20 tracking-wider">
                          exception
                        </span>
                      )}

                      {item.needsApproval && !isDone && (
                        <div className="ml-auto flex gap-2">
                          <button
                            onClick={() => setApproved((s) => new Set([...s, item.id]))}
                            className="font-mono text-[10px] uppercase px-2.5 py-1 bg-amber text-ink-900 hover:bg-amber-bright transition-colors tracking-wider"
                          >
                            {item.approveLabel}
                          </button>
                          <button
                            onClick={() => setDismissed((s) => new Set([...s, item.id]))}
                            className="font-mono text-[10px] uppercase px-2.5 py-1 border border-ink-600/60 text-ink-400 hover:text-white hover:border-ink-400 transition-colors tracking-wider"
                          >
                            {item.rejectLabel}
                          </button>
                        </div>
                      )}
                      {isDone && (
                        <span className="ml-auto font-mono text-[10px] text-emerald uppercase tracking-wider">✓ approved</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Right panel — exceptions */}
        <aside className="w-full lg:w-[340px] shrink-0 lg:overflow-y-auto">
          <div className="px-4 py-3 border-b border-ink-600/60">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-crimson">
              Exceptions · {visibleExceptions.length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {visibleExceptions.map((ex) => (
              <div key={ex.id} className={cn("bg-ink-800/50 border p-4 relative", exceptionBorder[ex.severity])}>
                <button
                  onClick={() => setDismissed((s) => new Set([...s, ex.id]))}
                  className="absolute top-3 right-3 text-ink-500 hover:text-ink-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", ex.severity === "error" ? "text-crimson" : "text-amber")} />
                  <span className="font-mono text-[11px] text-white pr-4 leading-snug">{ex.title}</span>
                </div>

                <div className="font-mono text-[10px] text-amber mb-2">{ex.context}</div>
                <p className="font-mono text-[10px] text-ink-400 leading-relaxed mb-3">{ex.description}</p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDismissed((s) => new Set([...s, ex.id]))}
                    className={cn(
                      "flex-1 font-mono text-[10px] uppercase py-1.5 tracking-wider transition-colors",
                      ex.severity === "error"
                        ? "bg-crimson/20 border border-crimson-muted/50 text-crimson hover:bg-crimson/30"
                        : "bg-amber/10 border border-amber-muted/40 text-amber hover:bg-amber/20"
                    )}
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() => setDismissed((s) => new Set([...s, ex.id]))}
                    className="font-mono text-[10px] uppercase px-3 py-1.5 border border-ink-600/60 text-ink-400 hover:text-white hover:border-ink-400 transition-colors tracking-wider"
                  >
                    Snooze
                  </button>
                </div>
              </div>
            ))}

            {visibleExceptions.length === 0 && (
              <div className="p-6 text-center">
                <div className="font-mono text-[10px] uppercase tracking-wider text-emerald mb-1">All clear</div>
                <div className="font-mono text-[10px] text-ink-500">No exceptions pending</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 border-t border-ink-600/60 bg-ink/95 backdrop-blur px-4 sm:px-8 py-3 flex flex-wrap items-center gap-3 sm:gap-6 z-10">
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-[10px] text-ink-400 flex-1 min-w-0 flex-wrap">
          {[
            { label: "agents", value: AGENTS.length },
            { label: "active trades", value: 47 },
            { label: "exceptions", value: visibleExceptions.length },
          ].map((s) => (
            <span key={s.label}>
              <span className={cn("text-white", s.label === "exceptions" && s.value > 0 && "text-crimson")}>
                {s.value}
              </span>
              {" "}{s.label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:inline font-mono text-[10px] text-ink-400 shrink-0">95% auto-processed this week</span>
          <span className="sm:hidden font-mono text-[10px] text-ink-400 shrink-0">95% auto</span>
          <div className="w-20 sm:w-32 h-1.5 bg-ink-700 border border-ink-600/60 overflow-hidden">
            <div className="h-full bg-amber" style={{ width: "95%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

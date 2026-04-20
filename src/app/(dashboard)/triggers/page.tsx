import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TriggersPage() {
  const supabase = await createClient();
  const { data: triggers } = await supabase
    .from("triggers")
    .select("*, deals(deal_ref, commodity)")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
          / TRIGGERS
        </div>
        <h1 className="font-display text-4xl tracking-tight">Rules</h1>
        <p className="text-ink-300 mt-2 text-sm">
          Event-driven rules that flag, notify, or release funds when real-world
          conditions are met. This is the bridge to programmable settlement.
        </p>
      </div>

      <div className="bg-ink-800/50 border border-ink-600/60">
        <div className="grid grid-cols-[1fr_120px_140px_100px_100px] gap-3 px-5 py-2.5 border-b border-ink-600/60 bg-ink-700/30 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          <div>Rule</div>
          <div>Deal</div>
          <div>Action</div>
          <div>Status</div>
          <div className="text-right">Fired</div>
        </div>
        <div className="divide-y divide-ink-600/40">
          {(triggers || []).map((t: any) => (
            <div
              key={t.id}
              className="grid grid-cols-[1fr_120px_140px_100px_100px] gap-3 px-5 py-3 hover:bg-ink-700/40 transition items-center"
            >
              <div className="flex items-start gap-3 min-w-0">
                {t.status === "fired" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                ) : t.status === "armed" ? (
                  <Clock className="w-4 h-4 text-amber shrink-0 mt-0.5 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-ink-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="text-sm truncate">{t.name}</div>
                  <div className="text-[11px] text-ink-400 mt-0.5 truncate">
                    {t.description}
                  </div>
                  {t.conditions && (
                    <div className="font-mono text-[10px] text-ink-500 mt-1 bg-ink-700/40 px-1.5 py-0.5 inline-block">
                      {JSON.stringify(t.conditions).slice(0, 80)}
                    </div>
                  )}
                </div>
              </div>
              <Link
                href={`/deals/${t.deal_id}`}
                className="font-mono text-xs text-amber hover:underline"
              >
                {t.deals?.deal_ref}
              </Link>
              <span className="font-mono text-[10px] uppercase text-ink-300">
                {t.action.replace(/_/g, " ")}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase px-1.5 py-0.5 border inline-block text-center w-fit",
                  t.status === "fired"
                    ? "text-emerald border-emerald-muted"
                    : t.status === "armed"
                    ? "text-amber border-amber-muted"
                    : "text-ink-400 border-ink-500"
                )}
              >
                {t.status}
              </span>
              <span className="text-right font-mono text-[10px] text-ink-400">
                {t.fired_at ? relativeTime(t.fired_at) : "—"}
              </span>
            </div>
          ))}
          {(!triggers || triggers.length === 0) && (
            <div className="px-5 py-16 text-center text-ink-400 text-sm">
              No triggers configured. Create them from a deal page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

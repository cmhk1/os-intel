import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CopilotPage() {
  const supabase = await createClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("id, deal_ref, commodity, status")
    .order("updated_at", { ascending: false })
    .limit(20);

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
          / COPILOT
        </div>
        <h1 className="font-display text-4xl tracking-tight">
          AI <span className="italic text-amber">copilot</span>
        </h1>
        <p className="text-ink-300 mt-2 text-sm max-w-2xl">
          The deal-aware AI assistant. Grounded in your documents, AIS, events,
          and counterparties. Start by picking a deal — the copilot lives on
          every deal page.
        </p>
      </div>

      <div className="bg-ink-800/50 border border-ink-600/60 p-6 mb-8">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber shrink-0 mt-1" />
          <div>
            <div className="font-display text-xl mb-1">What it can do</div>
            <ul className="text-sm text-ink-200 space-y-1.5 mt-3">
              <li>• Cross-check B/L, LC, invoice and inspection data</li>
              <li>• Flag inconsistencies between documents and AIS</li>
              <li>• Summarize risk exposure and blocking issues</li>
              <li>• Explain what's needed to move a deal forward</li>
              <li>• Track trigger state and fired conditions</li>
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mb-3">
          Open a deal to start
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(deals || []).map((d) => (
            <Link
              key={d.id}
              href={`/deals/${d.id}`}
              className="bg-ink-800/50 border border-ink-600/60 hover:border-amber/50 px-4 py-3 flex items-center justify-between transition group"
            >
              <div>
                <div className="font-mono text-xs text-amber">{d.deal_ref}</div>
                <div className="text-sm mt-1">
                  {d.commodity}{" "}
                  <span className="text-ink-400 text-xs">({d.status.replace("_", " ")})</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-ink-400 group-hover:text-amber transition" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

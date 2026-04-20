import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText } from "lucide-react";
import { cn, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: docs } = await supabase
    .from("documents")
    .select("*, deals(deal_ref, commodity)")
    .order("uploaded_at", { ascending: false });

  return (
    <div className="p-8 max-w-[1600px]">
      <div className="mb-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
          / DOCUMENTS
        </div>
        <h1 className="font-display text-4xl tracking-tight">Archive</h1>
        <p className="text-ink-300 mt-2 text-sm">
          All trade documents across deals. AI-parsed and cross-checked on upload.
        </p>
      </div>

      <div className="bg-ink-800/50 border border-ink-600/60">
        <div className="grid grid-cols-[1fr_160px_120px_110px_110px_100px] gap-3 px-5 py-2.5 border-b border-ink-600/60 bg-ink-700/30 font-mono text-[10px] uppercase tracking-wider text-ink-400">
          <div>Filename</div>
          <div>Type</div>
          <div>Deal</div>
          <div>Parse</div>
          <div>Validation</div>
          <div className="text-right">Uploaded</div>
        </div>
        <div className="divide-y divide-ink-600/40">
          {(docs || []).map((d: any) => (
            <Link
              key={d.id}
              href={`/deals/${d.deal_id}`}
              className="grid grid-cols-[1fr_160px_120px_110px_110px_100px] gap-3 px-5 py-3 hover:bg-ink-700/40 transition items-center"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                <span className="text-sm truncate">{d.filename}</span>
              </div>
              <span className="font-mono text-[10px] uppercase text-ink-300">
                {d.doc_type.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-xs text-amber">
                {d.deals?.deal_ref}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase px-1.5 py-0.5 border inline-block text-center w-fit",
                  d.parse_status === "parsed"
                    ? "text-emerald border-emerald-muted"
                    : d.parse_status === "parsing"
                    ? "text-amber border-amber-muted"
                    : d.parse_status === "failed"
                    ? "text-crimson border-crimson-muted"
                    : "text-ink-400 border-ink-500"
                )}
              >
                {d.parse_status}
              </span>
              <span
                className={cn(
                  "font-mono text-[10px] uppercase px-1.5 py-0.5 border inline-block text-center w-fit",
                  d.validation_status === "clean"
                    ? "text-emerald border-emerald-muted"
                    : d.validation_status === "warning"
                    ? "text-amber border-amber-muted"
                    : d.validation_status === "error"
                    ? "text-crimson border-crimson-muted"
                    : "text-ink-400 border-ink-500"
                )}
              >
                {d.validation_status}
              </span>
              <span className="text-right font-mono text-[10px] text-ink-400">
                {relativeTime(d.uploaded_at)}
              </span>
            </Link>
          ))}
          {(!docs || docs.length === 0) && (
            <div className="px-5 py-16 text-center text-ink-400 text-sm">
              No documents. Upload B/L, LC, invoices from any deal page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

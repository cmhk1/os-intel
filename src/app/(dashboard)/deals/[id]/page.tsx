import { GitBranch } from "lucide-react";

export default function DealDetailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-8">/ DEALS</div>
      <GitBranch className="w-8 h-8 text-ink-600 mb-6" />
      <h1 className="font-display text-4xl tracking-tight mb-4">Deals</h1>
      <p className="font-mono text-[11px] text-ink-400 text-center max-w-sm leading-relaxed mb-8">
        Full trade book with status tracking, counterparty management, and AI risk scoring across your commodity deals.
      </p>
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] px-5 py-2 border border-ink-600/60 text-ink-500">
        This feature is coming soon
      </div>
    </div>
  );
}

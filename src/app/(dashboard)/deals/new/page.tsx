import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewDealPage() {
  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-amber transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Book
      </Link>

      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">
        / NEW DEAL
      </div>
      <h1 className="font-display text-4xl tracking-tight mb-4">Create deal</h1>

      <div className="bg-ink-800/50 border border-ink-600/60 p-8">
        <p className="text-ink-200 text-sm mb-4">
          Deal creation form — wire up in next iteration. For v0, use the Supabase
          dashboard or the seed SQL to add deals. The schema is ready:
        </p>
        <pre className="font-mono text-[11px] bg-ink-900 border border-ink-600 p-4 overflow-x-auto text-ink-200">
{`insert into deals (
  org_id, deal_ref, commodity, grade, quantity, unit,
  price, currency, incoterm, buyer_id, seller_id,
  vessel_id, load_port, discharge_port, ...
) values (...);`}
        </pre>
      </div>
    </div>
  );
}

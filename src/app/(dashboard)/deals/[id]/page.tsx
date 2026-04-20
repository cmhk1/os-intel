import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Zap,
  Sparkles,
  Ship,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn, formatCompact, formatCurrency, relativeTime } from "@/lib/utils";
import DealCopilot from "@/components/DealCopilot";
import DocumentUpload from "@/components/DocumentUpload";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  draft: "text-ink-300 bg-ink-600/40 border-ink-500",
  contracted: "text-azure bg-azure-muted/20 border-azure-muted/50",
  loading: "text-amber bg-amber-dim/30 border-amber-muted/50",
  in_transit: "text-amber-bright bg-amber-dim/40 border-amber-muted",
  discharged: "text-emerald bg-emerald-muted/30 border-emerald-muted",
  settled: "text-emerald bg-emerald-muted/40 border-emerald-muted",
  disputed: "text-crimson bg-crimson-muted/30 border-crimson-muted",
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: deal } = await supabase
    .from("deals")
    .select(
      "*, vessels(*), buyer:counterparties!buyer_id(*), seller:counterparties!seller_id(*), bank:counterparties!bank_id(*), surveyor:counterparties!surveyor_id(*)"
    )
    .eq("id", id)
    .single();

  if (!deal) notFound();

  const [{ data: events }, { data: docs }, { data: triggers }] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("deal_id", id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("documents")
      .select("*")
      .eq("deal_id", id)
      .order("uploaded_at", { ascending: false }),
    supabase.from("triggers").select("*").eq("deal_id", id),
  ]);

  const notional = Number(deal.price || 0) * Number(deal.quantity || 0);

  return (
    <div className="p-8 max-w-[1600px]">
      {/* Back */}
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-amber transition mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Book
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span
              className={cn(
                "font-mono text-[10px] uppercase px-2 py-1 border tracking-wider",
                statusStyles[deal.status]
              )}
            >
              {deal.status.replace("_", " ")}
            </span>
            <span className="font-mono text-sm text-ink-300">{deal.deal_ref}</span>
            <span
              className={cn(
                "font-mono text-[10px] uppercase px-2 py-1 border tracking-wider",
                (deal.ai_risk_score || 0) >= 60
                  ? "text-crimson border-crimson-muted"
                  : (deal.ai_risk_score || 0) >= 30
                  ? "text-amber border-amber-muted"
                  : "text-emerald border-emerald-muted"
              )}
            >
              RISK {deal.ai_risk_score ?? "—"}
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">
            {deal.commodity}
            {deal.grade && (
              <span className="text-ink-300 italic"> · {deal.grade}</span>
            )}
          </h1>
          <div className="text-lg text-ink-300 font-mono">
            <span className="text-white">{deal.load_port}</span> →{" "}
            <span className="text-white">{deal.discharge_port}</span>
          </div>
          {deal.ai_summary && (
            <div className="mt-4 text-sm text-ink-200 bg-amber-dim/10 border-l-2 border-amber px-4 py-3 max-w-3xl">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-amber mb-1">
                <Sparkles className="w-3 h-3" />
                AI summary
              </div>
              {deal.ai_summary}
            </div>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mb-1">
            Notional
          </div>
          <div className="font-display text-5xl text-amber text-tabular">
            {formatCurrency(notional, deal.currency || "USD")}
          </div>
          <div className="font-mono text-xs text-ink-400 mt-1">
            {formatCompact(deal.quantity)} {deal.unit} @ {deal.price}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main column */}
        <div className="col-span-2 space-y-6">
          {/* Terms */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="px-5 py-3 border-b border-ink-600/60 font-mono text-[11px] uppercase tracking-wider">
              Commercial terms
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-ink-600/40">
              <Field label="Incoterm" value={deal.incoterm} />
              <Field label="Price mechanism" value={deal.price_mechanism} />
              <Field label="Payment terms" value={deal.payment_terms} />
              <Field label="Buyer" value={deal.buyer?.name} href="/counterparties" />
              <Field label="Seller" value={deal.seller?.name} href="/counterparties" />
              <Field label="Bank" value={deal.bank?.name} />
              <Field label="Surveyor" value={deal.surveyor?.name} />
              <Field
                label="LC number"
                value={deal.lc_number}
                mono
              />
              <Field
                label="LC expiry"
                value={deal.lc_expiry ? new Date(deal.lc_expiry).toLocaleDateString() : null}
              />
              <Field
                label="Laycan"
                value={
                  deal.laycan_start && deal.laycan_end
                    ? `${new Date(deal.laycan_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} – ${new Date(deal.laycan_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                    : null
                }
              />
              <Field
                label="ETD"
                value={deal.etd ? new Date(deal.etd).toLocaleDateString() : null}
              />
              <Field
                label="ETA"
                value={deal.eta ? new Date(deal.eta).toLocaleDateString() : null}
              />
            </div>
          </section>

          {/* Vessel */}
          {deal.vessels && (
            <section className="bg-ink-800/50 border border-ink-600/60">
              <div className="px-5 py-3 border-b border-ink-600/60 font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
                <Ship className="w-3 h-3 text-amber" />
                Vessel
              </div>
              <div className="p-5">
                <div className="flex items-start gap-6">
                  <div>
                    <div className="font-display text-2xl">{deal.vessels.name}</div>
                    <div className="font-mono text-xs text-ink-400 mt-1">
                      IMO {deal.vessels.imo} · MMSI {deal.vessels.mmsi || "—"}
                    </div>
                  </div>
                  <div className="ml-auto grid grid-cols-3 gap-6 text-right">
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-400">Speed</div>
                      <div className="font-mono text-sm">
                        {deal.vessels.last_speed || "—"}kn
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-400">Heading</div>
                      <div className="font-mono text-sm">
                        {deal.vessels.last_heading || "—"}°
                      </div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-ink-400">Status</div>
                      <div className="font-mono text-xs">
                        {deal.vessels.last_status || "—"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-amber" />
                  <span className="font-mono text-xs text-ink-300">
                    {deal.vessels.last_position_lat?.toFixed(4)}°,{" "}
                    {deal.vessels.last_position_lon?.toFixed(4)}°
                  </span>
                  <span className="text-ink-400 text-xs ml-2">
                    updated {relativeTime(deal.vessels.last_position_at)}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Documents */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="px-5 py-3 border-b border-ink-600/60 flex items-center justify-between">
              <div className="font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3 h-3 text-amber" />
                Documents
              </div>
              <DocumentUpload dealId={deal.id} />
            </div>
            <div className="divide-y divide-ink-600/40">
              {(docs || []).map((doc: any) => (
                <div key={doc.id} className="px-5 py-3 flex items-center gap-4">
                  <div
                    className={cn(
                      "w-1 h-6",
                      doc.validation_status === "clean"
                        ? "bg-emerald"
                        : doc.validation_status === "warning"
                        ? "bg-amber"
                        : doc.validation_status === "error"
                        ? "bg-crimson"
                        : "bg-ink-500"
                    )}
                  />
                  <div className="flex-1">
                    <div className="text-sm">{doc.filename}</div>
                    <div className="font-mono text-[10px] text-ink-400 uppercase">
                      {doc.doc_type.replace(/_/g, " ")} · {relativeTime(doc.uploaded_at)}
                    </div>
                  </div>
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase px-1.5 py-0.5 border",
                      doc.validation_status === "clean"
                        ? "text-emerald border-emerald-muted"
                        : doc.validation_status === "warning"
                        ? "text-amber border-amber-muted"
                        : doc.validation_status === "error"
                        ? "text-crimson border-crimson-muted"
                        : "text-ink-400 border-ink-500"
                    )}
                  >
                    {doc.validation_status}
                  </span>
                </div>
              ))}
              {(!docs || docs.length === 0) && (
                <div className="px-5 py-12 text-center text-ink-400 text-sm">
                  No documents yet. Upload B/L, LC, invoices, COAs.
                </div>
              )}
            </div>
          </section>

          {/* Triggers */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="px-5 py-3 border-b border-ink-600/60 font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber" />
              Triggers
            </div>
            <div className="divide-y divide-ink-600/40">
              {(triggers || []).map((t: any) => (
                <div key={t.id} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {t.status === "fired" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald" />
                    ) : t.status === "armed" ? (
                      <Clock className="w-4 h-4 text-amber" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-ink-400" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm">{t.name}</div>
                      <div className="font-mono text-[10px] text-ink-400">
                        {t.action.replace(/_/g, " ")}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase px-1.5 py-0.5 border",
                        t.status === "fired"
                          ? "text-emerald border-emerald-muted"
                          : t.status === "armed"
                          ? "text-amber border-amber-muted"
                          : "text-ink-400 border-ink-500"
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!triggers || triggers.length === 0) && (
                <div className="px-5 py-8 text-center text-ink-400 text-sm">
                  No triggers configured.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Copilot */}
          <DealCopilot dealId={deal.id} dealRef={deal.deal_ref} />

          {/* Timeline */}
          <section className="bg-ink-800/50 border border-ink-600/60">
            <div className="px-5 py-3 border-b border-ink-600/60 font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3 h-3 text-amber" />
              Timeline
            </div>
            <div className="p-5">
              <div className="relative">
                <div className="absolute left-[5px] top-2 bottom-2 w-px bg-ink-500" />
                {(events || []).map((e: any, i: number) => (
                  <div key={e.id} className="relative pl-6 pb-4 last:pb-0">
                    <div
                      className={cn(
                        "absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 border-ink-800",
                        e.severity === "critical" || e.severity === "error"
                          ? "bg-crimson"
                          : e.severity === "warn"
                          ? "bg-amber"
                          : "bg-ink-400"
                      )}
                    />
                    <div className="text-xs text-white">{e.event_type}</div>
                    <div className="font-mono text-[10px] text-ink-400 mt-0.5">
                      {e.source} · {relativeTime(e.occurred_at)}
                    </div>
                    {e.payload && Object.keys(e.payload).length > 0 && (
                      <div className="font-mono text-[10px] text-ink-300 mt-1 bg-ink-700/40 px-2 py-1">
                        {JSON.stringify(e.payload)}
                      </div>
                    )}
                  </div>
                ))}
                {(!events || events.length === 0) && (
                  <div className="text-ink-400 text-sm">No events yet.</div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  href,
  mono,
}: {
  label: string;
  value?: string | null;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-ink-800 p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-400 mb-1">
        {label}
      </div>
      <div className={cn("text-sm", mono && "font-mono", !value && "text-ink-500")}>
        {value || "—"}
      </div>
    </div>
  );
}

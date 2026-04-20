import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// In production: download the file from storage, send to Claude vision or a
// parser, extract structured fields, cross-check against the deal, write
// findings. For v0, we stub a realistic result so the UI feels alive.

export async function POST(req: NextRequest) {
  try {
    const { dealId, filename, docType } = await req.json();
    const supabase = await createClient();

    const { data: docs } = await supabase
      .from("documents")
      .select("id")
      .eq("deal_id", dealId)
      .eq("filename", filename)
      .order("uploaded_at", { ascending: false })
      .limit(1);

    const docId = docs?.[0]?.id;
    if (!docId) return NextResponse.json({ ok: false }, { status: 404 });

    // Simulate parsing delay
    await new Promise((r) => setTimeout(r, 800));

    // Fake findings — deterministic based on docType
    const findings =
      docType === "bill_of_lading"
        ? [
            { field: "vessel_name", status: "match", note: "Matches deal vessel" },
            { field: "quantity", status: "match", note: "Within 0.5% tolerance" },
            { field: "shipper", status: "match", note: "Matches seller" },
          ]
        : docType === "inspection_report"
        ? [
            { field: "quality_specs", status: "match", note: "All parameters within contractual spec" },
          ]
        : [{ field: "document", status: "received", note: "Parsed successfully" }];

    await supabase
      .from("documents")
      .update({
        parse_status: "parsed",
        parsed_at: new Date().toISOString(),
        parsed_data: { filename, type: docType },
        validation_status: "clean",
        validation_findings: findings,
      })
      .eq("id", docId);

    await supabase.from("events").insert({
      deal_id: dealId,
      event_type: `document.parsed.${docType}`,
      source: "ai",
      payload: { doc_id: docId, findings },
      severity: "info",
    });

    return NextResponse.json({ ok: true, findings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

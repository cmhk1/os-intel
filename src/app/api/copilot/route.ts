import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { dealId, messages } = await req.json();

    const supabase = await createClient();

    // Gather full deal context from DB
    const { data: deal } = await supabase
      .from("deals")
      .select(
        "*, vessels(*), buyer:counterparties!buyer_id(*), seller:counterparties!seller_id(*), bank:counterparties!bank_id(*), surveyor:counterparties!surveyor_id(*)"
      )
      .eq("id", dealId)
      .single();

    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const [{ data: docs }, { data: events }, { data: triggers }] = await Promise.all([
      supabase.from("documents").select("*").eq("deal_id", dealId),
      supabase
        .from("events")
        .select("*")
        .eq("deal_id", dealId)
        .order("occurred_at", { ascending: false })
        .limit(30),
      supabase.from("triggers").select("*").eq("deal_id", dealId),
    ]);

    const context = {
      deal,
      documents: docs,
      events,
      triggers,
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          reply:
            "[No Anthropic API key configured] I can see the deal context: " +
            `${deal.deal_ref} — ${deal.commodity} (${deal.grade}), ${deal.load_port} → ${deal.discharge_port}, ` +
            `status: ${deal.status}, risk: ${deal.ai_risk_score}. ` +
            `Set ANTHROPIC_API_KEY in Vercel to enable the full copilot.`,
        },
        { status: 200 }
      );
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are the OS-Intel Deal Copilot. You help commodity traders and operators understand, check, and move forward on a specific physical trade.

You have full structured context on ONE deal below. Ground every answer in this context — do not hallucinate. If the user asks something you can't answer from the context, say so and suggest what data would be needed.

Be concise. Use the operator's language (LC, B/L, laycan, demurrage, COA, etc.). When flagging issues, be specific about the document, field, and tolerance. When suggesting next steps, be concrete and actionable.

Format: plain prose. No markdown headers. One short paragraph unless the user asks for detail.

DEAL CONTEXT:
${JSON.stringify(context, null, 2)}`;

    const userMessages = messages
      .filter((m: any) => m.role === "user" || m.role === "assistant")
      .slice(-20)
      .map((m: any) => ({ role: m.role, content: m.content }));

    const completion = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: userMessages,
    });

    const reply =
      completion.content
        .filter((c: any) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n") || "(no response)";

    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Copilot error" },
      { status: 500 }
    );
  }
}

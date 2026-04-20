"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function DealCopilot({
  dealId,
  dealRef,
}: {
  dealId: string;
  dealRef: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hi — I'm the Copilot for ${dealRef}. I have full context on the documents, vessel, counterparties, and events. What do you want to check?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, messages: next }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            data.reply ||
            data.error ||
            "Something went wrong. Check your Anthropic API key is set.",
        },
      ]);
    } catch (e: any) {
      setMessages([
        ...next,
        { role: "assistant", content: `Error: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const prompts = [
    "Are all docs consistent?",
    "What's blocking settlement?",
    "Summarize risk exposure",
  ];

  return (
    <section className="bg-ink-800/50 border border-ink-600/60 flex flex-col h-[520px]">
      <div className="px-5 py-3 border-b border-ink-600/60 font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-amber" />
        Deal copilot
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "bg-amber-dim/20 border-l-2 border-amber px-3 py-2 ml-6"
                : "bg-ink-700/40 border-l-2 border-ink-500 px-3 py-2 mr-6"
            }
          >
            <div className="font-mono text-[9px] uppercase tracking-wider text-ink-400 mb-1">
              {m.role === "user" ? "You" : "Copilot"}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="bg-ink-700/40 border-l-2 border-amber px-3 py-2 mr-6 flex items-center gap-2 text-ink-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs font-mono">thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setInput(p)}
              className="text-[10px] font-mono border border-ink-500 px-2 py-1 hover:border-amber hover:text-amber transition"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-ink-600/60 p-2 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the copilot…"
          className="flex-1 bg-transparent outline-none text-sm px-2 placeholder:text-ink-400"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="bg-amber text-ink-900 p-1.5 hover:bg-amber-bright transition disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}

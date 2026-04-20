"use client";

import { Search, Command } from "lucide-react";

export default function CommandBar() {
  return (
    <div className="flex items-center gap-2 bg-ink-700/60 border border-ink-600 px-3 py-1.5 rounded-sm w-96 max-w-[40vw]">
      <Search className="w-3.5 h-3.5 text-ink-400" />
      <input
        placeholder="Search deals, vessels, counterparties…"
        className="bg-transparent outline-none text-sm flex-1 placeholder:text-ink-400"
      />
      <div className="flex items-center gap-1 text-[10px] font-mono text-ink-400 bg-ink-600/60 px-1.5 py-0.5 rounded-sm">
        <Command className="w-2.5 h-2.5" />K
      </div>
    </div>
  );
}

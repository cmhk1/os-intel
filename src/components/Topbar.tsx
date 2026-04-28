"use client";

import { Menu } from "lucide-react";
import CommandBar from "@/components/CommandBar";
import { useSidebar } from "@/lib/sidebar-context";

export default function Topbar() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="h-14 border-b border-ink-600/60 px-3 sm:px-6 flex items-center gap-3 sm:gap-4 sticky top-0 bg-ink/95 backdrop-blur z-30">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
        className="md:hidden -ml-1 p-2.5 text-ink-200 hover:text-white rounded-sm"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Brand on mobile (sidebar hidden) */}
      <div className="md:hidden flex items-center gap-2 min-w-0">
        <span className="w-1.5 h-1.5 bg-amber rounded-full shadow-[0_0_8px_#f5a524] animate-pulse shrink-0" />
        <span className="font-mono text-[10px] tracking-[0.25em] uppercase truncate">
          OS-INTEL
        </span>
      </div>

      {/* Search — pushes right on mobile, inline on desktop */}
      <div className="ml-auto md:ml-0 flex-1 flex justify-end md:justify-start">
        <CommandBar />
      </div>

      {/* Status — desktop only */}
      <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono ml-auto">
        <span className="flex items-center gap-1.5 text-ink-300">
          <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
          AIS connected
        </span>
        <span className="text-ink-400">·</span>
        <span className="text-ink-300" suppressHydrationWarning>
          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} UTC
        </span>
      </div>
    </header>
  );
}

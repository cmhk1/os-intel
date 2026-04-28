"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ship,
  FileText,
  GitBranch,
  Banknote,
  Sparkles,
  Globe2,
  Bot,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/lib/sidebar-context";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/map", label: "Map", icon: Globe2 },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/deals", label: "Deals", icon: GitBranch },
  { href: "/vessels", label: "Vessels", icon: Ship },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/triggers", label: "Triggers", icon: Zap },
  { href: "/lending", label: "Lending", icon: Banknote },
  { href: "/copilot", label: "Copilot", icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, setMobileOpen, desktopCollapsed, toggleDesktopCollapsed } = useSidebar();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden={!mobileOpen}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={cn(
          // base
          "z-50 flex flex-col bg-ink border-r border-ink-600/60",
          // mobile: fixed drawer
          "fixed inset-y-0 left-0 w-72 max-w-[85vw] transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // desktop: sticky, in flow
          "md:sticky md:top-0 md:h-screen md:translate-x-0 md:transition-[width]",
          desktopCollapsed ? "md:w-16" : "md:w-60"
        )}
      >
        {/* Brand */}
        <div className={cn(
          "h-14 flex items-center gap-2.5 border-b border-ink-600/60 shrink-0",
          desktopCollapsed ? "md:px-3 md:justify-center" : "md:px-5",
          "px-5"
        )}>
          <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_10px_#f5a524] animate-pulse shrink-0" />
          <span className={cn(
            "font-mono text-[11px] tracking-[0.25em] uppercase",
            desktopCollapsed && "md:hidden"
          )}>
            OS-INTEL
          </span>
          <span className={cn(
            "ml-auto text-[10px] font-mono text-ink-400",
            desktopCollapsed && "md:hidden"
          )}>
            v0.1
          </span>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="md:hidden ml-auto -mr-2 p-2 text-ink-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Org */}
        <div className={cn(
          "border-b border-ink-600/60 shrink-0",
          desktopCollapsed ? "md:hidden" : "px-5 py-4"
        )}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1">
            Workspace
          </div>
          <div className="text-sm truncate">Demo Trading Co.</div>
        </div>

        {/* Nav */}
        <nav
          className={cn("flex-1 p-2 overflow-y-auto", desktopCollapsed && "md:px-1.5")}
          aria-label="Main"
        >
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={desktopCollapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-sm transition-colors",
                  // padding adapts to collapsed
                  "px-3 py-2.5 md:py-2",
                  desktopCollapsed && "md:justify-center md:px-0 md:py-2.5",
                  // colors
                  active
                    ? "bg-ink-700/80 text-white"
                    : "text-ink-200 hover:text-white hover:bg-ink-700/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    active ? "text-amber" : "text-ink-400 group-hover:text-amber"
                  )}
                />
                <span className={cn("text-sm", desktopCollapsed && "md:hidden")}>
                  {item.label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className={cn(
                      "ml-auto w-1 h-4 bg-amber rounded-sm",
                      desktopCollapsed && "md:hidden"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + collapse toggle */}
        <div className="border-t border-ink-600/60 shrink-0">
          <div className={cn(
            "flex items-center gap-3 p-3",
            desktopCollapsed && "md:justify-center md:px-2"
          )}>
            <div className="w-7 h-7 bg-amber/20 border border-amber/40 rounded-sm flex items-center justify-center text-xs font-mono text-amber shrink-0">
              D
            </div>
            <div className={cn("flex-1 min-w-0", desktopCollapsed && "md:hidden")}>
              <div className="text-xs truncate">Demo User</div>
              <div className="text-[10px] font-mono uppercase text-ink-400">trader</div>
            </div>
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleDesktopCollapsed}
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!desktopCollapsed}
            className={cn(
              "hidden md:flex w-full items-center gap-2 px-3 py-2.5 border-t border-ink-600/60",
              "text-ink-400 hover:text-amber hover:bg-ink-700/40 transition-colors",
              desktopCollapsed && "justify-center px-0"
            )}
          >
            {desktopCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-wider">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

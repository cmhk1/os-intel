import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  LayoutDashboard,
  Ship,
  FileText,
  Users,
  Zap,
  GitBranch,
  Banknote,
  Sparkles,
} from "lucide-react";
import SignOutButton from "@/components/SignOutButton";
import CommandBar from "@/components/CommandBar";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/deals", label: "Deals", icon: GitBranch },
  { href: "/vessels", label: "Vessels", icon: Ship },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/counterparties", label: "Counterparties", icon: Users },
  { href: "/triggers", label: "Triggers", icon: Zap },
  { href: "/lending", label: "Lending", icon: Banknote },
  { href: "/copilot", label: "Copilot", icon: Sparkles },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, organizations(name, slug)")
    .eq("id", user.id)
    .single();

  const orgName =
    (profile?.organizations as unknown as { name?: string } | null)?.name ??
    "No organization";

  return (
    <div className="flex min-h-screen bg-ink text-ink-50">
      {/* Sidebar */}
      <aside className="w-60 border-r border-ink-600/60 flex flex-col sticky top-0 h-screen">
        {/* Brand */}
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-ink-600/60">
          <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_10px_#f5a524] animate-pulse" />
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase">
            OS-INTEL
          </span>
          <span className="ml-auto text-[10px] font-mono text-ink-400">v0.1</span>
        </div>

        {/* Org */}
        <div className="px-5 py-4 border-b border-ink-600/60">
          <div className="text-[10px] font-mono uppercase tracking-wider text-ink-400 mb-1">
            Workspace
          </div>
          <div className="text-sm truncate">{orgName}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-ink-200 hover:text-white hover:bg-ink-700/60 rounded-sm transition-colors group"
              >
                <Icon className="w-4 h-4 text-ink-400 group-hover:text-amber transition-colors" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-ink-600/60 p-2">
          <div className="px-3 py-2 flex items-center gap-3">
            <div className="w-7 h-7 bg-amber/20 border border-amber/40 rounded-sm flex items-center justify-center text-xs font-mono text-amber">
              {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs truncate">
                {profile?.full_name || profile?.email}
              </div>
              <div className="text-[10px] font-mono uppercase text-ink-400">
                {profile?.role || "member"}
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 border-b border-ink-600/60 px-6 flex items-center gap-4 sticky top-0 bg-ink/95 backdrop-blur z-20">
          <CommandBar />
          <div className="ml-auto flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-ink-300">
              <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
              AIS connected
            </span>
            <span className="text-ink-400">·</span>
            <span className="text-ink-300">
              {new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              UTC
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

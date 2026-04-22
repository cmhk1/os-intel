import Link from "next/link";
import { ArrowUpRight, Radar, FileCheck2, Zap, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 grid-lines opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/60 to-ink" />

      {/* Amber corner glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Nav */}
        <nav className="flex items-center justify-between px-8 py-6 border-b border-ink-600/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_12px_#f5a524] animate-pulse" />
            <span className="font-mono text-sm tracking-[0.2em] uppercase">OS-INTEL</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/dashboard"
              className="bg-amber text-ink-900 px-4 py-2 font-medium hover:bg-amber-bright transition flex items-center gap-1.5"
            >
              Open terminal <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="px-8 py-24 md:py-32 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-8 text-xs font-mono text-amber uppercase tracking-[0.3em]">
            <span className="w-8 h-px bg-amber" />
            Programmable trade operations
          </div>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight mb-8">
            The cockpit for
            <br />
            <span className="text-amber italic">commodity operators</span>.
          </h1>

          <p className="text-xl md:text-2xl text-ink-200 max-w-3xl leading-relaxed mb-12">
            Every bill of lading. Every vessel. Every trigger. Every settlement.
            In one rail.
          </p>

          <div className="flex items-center gap-4 mb-24">
            <Link
              href="/dashboard"
              className="bg-amber text-ink-900 px-6 py-3 font-medium hover:bg-amber-bright transition flex items-center gap-2"
            >
              Open terminal <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Feature strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-600/50 border border-ink-600/50">
            {[
              { icon: FileCheck2, label: "Documents", v: "B/L · LC · SGS" },
              { icon: Radar, label: "AIS", v: "real-time" },
              { icon: Zap, label: "Triggers", v: "rule-based release" },
              { icon: GitBranch, label: "Settlement", v: "event-contingent" },
            ].map(({ icon: Icon, label, v }) => (
              <div key={label} className="bg-ink p-6">
                <Icon className="w-5 h-5 text-amber mb-3" />
                <div className="font-mono text-xs uppercase tracking-wider text-ink-300 mb-1">
                  {label}
                </div>
                <div className="text-sm">{v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Thesis strip */}
        <section className="px-8 py-24 border-t border-ink-600/50">
          <div className="max-w-4xl mx-auto">
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-6">
              / THESIS
            </div>
            <h2 className="font-display text-3xl md:text-5xl leading-tight mb-8">
              The moat isn't the UX. It's the{" "}
              <span className="text-amber italic">
                event-contingent settlement ledger
              </span>
              .
            </h2>
            <p className="text-lg text-ink-200 leading-relaxed">
              Windward sees the ships. Kpler sees the cargo. Banks see the LC.
              Nobody sees the joint distribution — conditional on whether the
              money actually moves. We're the only entity that will.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 py-8 border-t border-ink-600/50 flex items-center justify-between text-xs font-mono text-ink-400">
          <span>OS-INTEL · {new Date().getFullYear()}</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald rounded-full" />
            system operational
          </span>
        </footer>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-lines opacity-40" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber/8 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 text-center px-8 max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_12px_#f5a524] animate-pulse" />
          <span className="font-mono text-xs tracking-[0.3em] uppercase text-ink-300">OS-INTEL</span>
        </div>

        <h1 className="font-display text-6xl md:text-8xl leading-[0.92] tracking-tight mb-8">
          The cockpit for<br />
          <span className="text-amber italic">commodity operators</span>.
        </h1>

        <p className="text-ink-300 text-lg mb-12 leading-relaxed">
          Deals. Vessels. Documents. Triggers. All in one rail.
        </p>

        <Link
          href="/terminal"
          className="inline-flex items-center gap-2 bg-amber text-ink-900 px-8 py-4 font-medium text-base hover:bg-amber-bright transition"
        >
          Open terminal <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>
    </main>
  );
}

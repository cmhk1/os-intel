import dynamic from "next/dynamic";

const WorldMap = dynamic(() => import("@/components/WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-amber/60 animate-pulse">
        <span className="w-1.5 h-1.5 bg-amber rounded-full" />
        Initialising
      </div>
    </div>
  ),
});

export default function TerminalPage() {
  return <WorldMap />;
}

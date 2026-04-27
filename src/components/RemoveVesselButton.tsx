"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";

export function RemoveVesselButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const router = useRouter();

  const handleClick = async () => {
    if (!confirming) { setConfirming(true); setError(null); return; }
    setLoading(true);
    const supabase = createBrowserClient();
    const { error: rpcErr } = await supabase.rpc("delete_vessel", { p_id: id });
    if (rpcErr) {
      setError(rpcErr.message);
      setLoading(false);
      setConfirming(false);
      return;
    }
    router.refresh();
  };

  if (error) {
    return (
      <span
        className="font-mono text-[10px] text-crimson cursor-pointer"
        title={error}
        onClick={() => setError(null)}
      >
        RPC error
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      onBlur={() => { if (!loading) setConfirming(false); }}
      disabled={loading}
      title={confirming ? `Click again to stop tracking ${name}` : `Stop tracking ${name}`}
      className={`flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider px-2 py-1 border transition-colors disabled:opacity-40 ${
        confirming
          ? "text-crimson border-crimson/40 bg-crimson/10 hover:bg-crimson/20"
          : "text-ink-500 border-ink-600/40 hover:text-crimson hover:border-crimson/40"
      }`}
    >
      {loading ? (
        <span className="w-3 h-3 border border-t-crimson rounded-full animate-spin" />
      ) : (
        <Trash2 className="w-3 h-3" />
      )}
      {confirming ? "Confirm" : "Remove"}
    </button>
  );
}

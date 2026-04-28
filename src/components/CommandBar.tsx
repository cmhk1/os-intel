"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface VesselResult {
  id: string;
  mmsi: string;
  name: string;
  last_position_lat: number;
  last_position_lon: number;
  last_speed: number;
  last_heading: number;
  last_status: string;
}

type ModalState = "idle" | "loading" | "error_404" | "error_generic";

export default function CommandBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [modalState, setModalState] = useState<ModalState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isMMSI = /^\d{9}$/.test(input.trim());

  // Open on Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Autofocus when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setInput("");
      setModalState("idle");
      setErrorMsg("");
    }
  }, [open]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLookup = useCallback(async () => {
    if (!isMMSI) return;
    setModalState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/vessels/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mmsi: input.trim() }),
      });

      const data = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (res.status === 404) {
        setModalState("error_404");
        return;
      }
      if (!res.ok) {
        const msg = String(data.error ?? data.message ?? `HTTP ${res.status}`);
        setErrorMsg(msg);
        setModalState("error_generic");
        return;
      }

      const vessel = data.vessel as VesselResult;
      setOpen(false);
      window.dispatchEvent(new CustomEvent("os:vessel-found", { detail: vessel }));
      setToast(`${vessel.name} added to map`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
      setModalState("error_generic");
    }
  }, [input, isMMSI]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isMMSI && modalState === "idle") {
      handleLookup();
    }
  };

  return (
    <>
      {/* Static topbar search trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex items-center gap-2 bg-ink-700/60 border border-ink-600 rounded-sm hover:border-ink-500 transition-colors text-left
                   p-2 sm:px-3 sm:py-1.5 sm:w-72 md:w-96 md:max-w-[40vw]"
      >
        <Search className="w-3.5 h-3.5 text-ink-400 shrink-0" />
        <span className="hidden sm:inline text-sm flex-1 text-ink-400 font-mono truncate">
          Search deals, vessels, counterparties…
        </span>
        <div className="hidden md:flex items-center gap-1 text-[10px] font-mono text-ink-400 bg-ink-600/60 px-1.5 py-0.5 rounded-sm shrink-0">
          <Command className="w-2.5 h-2.5" />K
        </div>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] sm:pt-[15vh] bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setOpen(false)}
        >
          <div
            ref={panelRef}
            className="max-w-lg w-full bg-ink-900 border border-ink-600/60 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-600/40">
              {modalState === "loading" ? (
                <div className="w-3.5 h-3.5 border-2 border-ink-600 border-t-amber rounded-full animate-spin shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-ink-400 shrink-0" />
              )}
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (modalState !== "idle") setModalState("idle");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter MMSI (9 digits) or vessel name…"
                disabled={modalState === "loading"}
                className="bg-transparent text-white text-sm font-mono outline-none w-full placeholder:text-ink-400 disabled:opacity-50"
              />
            </div>

            {/* Action row — shown when 9 digits */}
            {isMMSI && modalState === "idle" && (
              <button
                onClick={handleLookup}
                className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-ink-700/50 transition-colors group"
              >
                <span className="text-amber font-mono text-[11px] uppercase tracking-wider">
                  → Look up MMSI {input.trim()}
                </span>
              </button>
            )}

            {/* Loading state */}
            {modalState === "loading" && (
              <div className="px-4 py-3 flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-ink-400 uppercase tracking-wider">
                  Connecting to AISStream…
                </span>
              </div>
            )}

            {/* Error states */}
            {modalState === "error_404" && (
              <div className="px-4 py-3 flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-crimson uppercase tracking-wider">
                  Vessel not responding — not broadcasting AIS right now
                </span>
              </div>
            )}
            {modalState === "error_generic" && (
              <div className="px-4 py-3 flex flex-col gap-1">
                <span className="font-mono text-[11px] text-crimson uppercase tracking-wider">
                  AIS lookup failed
                </span>
                {errorMsg && (
                  <span className="font-mono text-[10px] text-ink-400">{errorMsg}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-ink-800 border border-ink-600/60 px-4 py-2.5 shadow-xl animate-slide-up">
          <span className="font-mono text-[11px] text-amber uppercase tracking-wider">
            {toast}
          </span>
        </div>
      )}
    </>
  );
}

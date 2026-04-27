"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";

const VESSELS = [
  { name: "SEAWAYS ENDEAVOR", lat: 25.8234, lon: 55.1234, destination: "FUJAIRAH", speed: "12.4kn" },
  { name: "NEW ADVANCE",      lat: 1.2674,  lon: 103.800, destination: "SINGAPORE", speed: "14.1kn" },
  { name: "STENA IMPULSE",    lat: 51.950,  lon: 4.1433,  destination: "ROTTERDAM", speed: "moored" },
  { name: "EAGLE BOSTON",     lat: 29.3759, lon: 48.2756, destination: "MINA AL AHMADI", speed: "11.8kn" },
  { name: "FRONT ALFA",       lat: 23.1167, lon: 39.3167, destination: "AIN SUKHNA", speed: "13.2kn" },
];

export default function WorldMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [25, 22],
      zoom: 2.4,
      attributionControl: false,
      pitchWithRotate: false,
    });

    mapRef.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.on("load", () => {
      VESSELS.forEach((vessel) => {
        const el = document.createElement("div");
        Object.assign(el.style, {
          width: "12px",
          height: "12px",
          background: "#f5a524",
          borderRadius: "50%",
          border: "2px solid rgba(255,184,0,0.8)",
          boxShadow: "0 0 0 4px rgba(245,165,36,0.2), 0 0 16px rgba(245,165,36,0.6)",
          cursor: "pointer",
        });

        const popup = new maplibregl.Popup({
          offset: 16,
          closeButton: false,
          maxWidth: "220px",
        }).setHTML(`
          <div style="background:#0a0a0a;border:1px solid #2e2e2e;padding:10px 14px;font-family:'JetBrains Mono',monospace;border-radius:0;">
            <div style="color:#f5a524;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:6px;">${vessel.name}</div>
            <div style="color:#c4c4c4;font-size:11px;">→ ${vessel.destination}</div>
            <div style="color:#525252;font-size:10px;margin-top:4px;">${vessel.speed}</div>
          </div>
        `);

        new maplibregl.Marker({ element: el })
          .setLngLat([vessel.lon, vessel.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top gradient fade */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />

      {/* Header */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-8 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-2 h-2 bg-amber rounded-full shadow-[0_0_12px_#f5a524] animate-pulse" />
          <span className="font-mono text-sm tracking-[0.25em] uppercase text-white">OS-INTEL</span>
        </Link>
        <nav className="flex items-center gap-8 font-mono text-[11px] uppercase tracking-wider">
          <Link href="/dashboard" className="text-white/60 hover:text-amber transition-colors">Overview</Link>
          <Link href="/deals"     className="text-white/60 hover:text-amber transition-colors">Deals</Link>
          <Link href="/vessels"   className="text-white/60 hover:text-amber transition-colors">Vessels</Link>
        </nav>
      </header>

      {/* Bottom status bar */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-5 left-8 z-20 flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider">
        <span className="flex items-center gap-2 text-white/50">
          <span className="w-1.5 h-1.5 bg-amber rounded-full shadow-[0_0_6px_#f5a524]" />
          {VESSELS.length} vessels tracked
        </span>
        <span className="text-white/20">·</span>
        <span className="text-white/30">AIS live</span>
      </div>
    </div>
  );
}

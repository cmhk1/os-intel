"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Vessel {
  id: string;
  name: string;
  imo: string;
  dealRef: string;
  cargo: string;
  quantity: string;
  buyer: string;
  seller: string;
  loadPort: string;
  dischargePort: string;
  lat: number;
  lon: number;
  loadLat: number;
  loadLon: number;
  dischargeLat: number;
  dischargeLon: number;
  speed: string;
  eta: string;
  status: string;
  exception: boolean;
  exceptionType?: string;
}

const VESSELS: Vessel[] = [
  {
    id: "v1", name: "SEAWAYS ENDEAVOR", imo: "9776633",
    dealRef: "OIL-2026-0142", cargo: "Arab Light", quantity: "2,000,000 BBL",
    buyer: "Vitol S.A.", seller: "Saudi Aramco Trading",
    loadPort: "RAS TANURA", dischargePort: "FUJAIRAH",
    lat: 25.82, lon: 55.12,
    loadLat: 26.64, loadLon: 50.16, dischargeLat: 25.13, dischargeLon: 56.33,
    speed: "12.4", eta: "29 Apr", status: "in_transit",
    exception: true, exceptionType: "AIS gap · 6h silence",
  },
  {
    id: "v2", name: "NEW ADVANCE", imo: "9729395",
    dealRef: "OIL-2026-0143", cargo: "Upper Zakum", quantity: "1,000,000 BBL",
    buyer: "Trafigura Pte Ltd", seller: "ADNOC Global Trading",
    loadPort: "DAS ISLAND", dischargePort: "SINGAPORE",
    lat: 4.50, lon: 78.30,
    loadLat: 24.52, loadLon: 52.87, dischargeLat: 1.27, dischargeLon: 103.80,
    speed: "14.1", eta: "28 Apr", status: "loading",
    exception: false,
  },
  {
    id: "v3", name: "STENA IMPULSE", imo: "9820553",
    dealRef: "OIL-2026-0147", cargo: "Gasoil 10ppm", quantity: "300,000 MT",
    buyer: "Gunvor Group", seller: "Saudi Aramco Trading",
    loadPort: "ANTWERP", dischargePort: "ROTTERDAM",
    lat: 51.95, lon: 4.14,
    loadLat: 51.23, loadLon: 4.40, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "0.2", eta: "Arrived", status: "arriving",
    exception: false,
  },
  {
    id: "v4", name: "EAGLE BOSTON", imo: "9465307",
    dealRef: "OIL-2026-0144", cargo: "Kuwait Export", quantity: "1,200,000 BBL",
    buyer: "Vitol S.A.", seller: "KPC Kuwait Petroleum",
    loadPort: "MINA AL AHMADI", dischargePort: "CHIBA",
    lat: 21.00, lon: 75.00,
    loadLat: 29.08, loadLon: 48.13, dischargeLat: 35.60, dischargeLon: 140.08,
    speed: "11.8", eta: "12 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v5", name: "FRONT ALFA", imo: "9845711",
    dealRef: "OIL-2026-0145", cargo: "Arab Light", quantity: "1,500,000 BBL",
    buyer: "Trafigura Pte Ltd", seller: "Saudi Aramco Trading",
    loadPort: "RAS TANURA", dischargePort: "AIN SUKHNA",
    lat: 23.12, lon: 39.32,
    loadLat: 26.64, loadLon: 50.16, dischargeLat: 29.57, dischargeLon: 32.55,
    speed: "13.2", eta: "30 Apr", status: "in_transit",
    exception: false,
  },
  {
    id: "v6", name: "NORDIC LUNA", imo: "9504606",
    dealRef: "OIL-2026-0148", cargo: "HSFO 380", quantity: "80,000 MT",
    buyer: "Gunvor Group", seller: "ADNOC Global Trading",
    loadPort: "FUJAIRAH", dischargePort: "HOUSTON",
    lat: 15.00, lon: 25.00,
    loadLat: 25.13, loadLon: 56.33, dischargeLat: 29.75, dischargeLon: -95.37,
    speed: "13.8", eta: "15 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v7", name: "PACIFIC GRACE", imo: "9597632",
    dealRef: "OIL-2026-0149", cargo: "Arab Medium", quantity: "2,100,000 BBL",
    buyer: "Trafigura Pte Ltd", seller: "ADNOC Global Trading",
    loadPort: "JUBAIL", dischargePort: "YOKOHAMA",
    lat: 10.00, lon: 68.00,
    loadLat: 27.01, loadLon: 49.65, dischargeLat: 35.44, dischargeLon: 139.64,
    speed: "14.3", eta: "18 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v8", name: "MINERVA HELEN", imo: "9407800",
    dealRef: "OIL-2026-0150", cargo: "Basra Heavy", quantity: "1,900,000 BBL",
    buyer: "Vitol S.A.", seller: "KPC Kuwait Petroleum",
    loadPort: "BASRA", dischargePort: "ROTTERDAM",
    lat: 29.98, lon: 48.78,
    loadLat: 29.98, loadLon: 48.78, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "0.0", eta: "8 May", status: "loading",
    exception: false,
  },
  {
    id: "v9", name: "GULF LEGEND", imo: "9398535",
    dealRef: "OIL-2026-0151", cargo: "Upper Zakum", quantity: "800,000 BBL",
    buyer: "Gunvor Group", seller: "ADNOC Global Trading",
    loadPort: "DAS ISLAND", dischargePort: "SINGAPORE",
    lat: 14.00, lon: 62.00,
    loadLat: 24.52, loadLon: 52.87, dischargeLat: 1.27, dischargeLon: 103.80,
    speed: "13.5", eta: "5 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v10", name: "ALTAIR TRADER", imo: "9543108",
    dealRef: "OIL-2026-0152", cargo: "Gasoil 50ppm", quantity: "120,000 MT",
    buyer: "Vitol S.A.", seller: "Saudi Aramco Trading",
    loadPort: "ROTTERDAM", dischargePort: "HOUSTON",
    lat: 44.00, lon: -28.00,
    loadLat: 51.96, loadLon: 4.14, dischargeLat: 29.75, dischargeLon: -95.37,
    speed: "14.0", eta: "3 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v11", name: "HANA PIONEER", imo: "9459420",
    dealRef: "OIL-2026-0153", cargo: "LNG", quantity: "65,000 MT",
    buyer: "Trafigura Pte Ltd", seller: "ADNOC Global Trading",
    loadPort: "QATARGAS", dischargePort: "TOKYO",
    lat: 18.00, lon: 82.00,
    loadLat: 25.29, loadLon: 51.53, dischargeLat: 35.65, dischargeLon: 139.76,
    speed: "18.2", eta: "2 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v12", name: "SUEZ FORTUNE", imo: "9678234",
    dealRef: "OIL-2026-0154", cargo: "Arab Light", quantity: "1,800,000 BBL",
    buyer: "Gunvor Group", seller: "Saudi Aramco Trading",
    loadPort: "AIN SUKHNA", dischargePort: "ROTTERDAM",
    lat: 34.50, lon: 22.00,
    loadLat: 29.57, loadLon: 32.55, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "13.0", eta: "4 May", status: "in_transit",
    exception: false,
  },
];

const STATUS_LABEL: Record<string, string> = {
  in_transit: "in transit",
  loading: "loading",
  arriving: "arriving",
  delayed: "delayed",
};

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [selected, setSelected] = useState<Vessel | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [52, 22],
      zoom: 1.6,
      pitch: 25,
      projection: { name: "globe" },
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    setTimeout(() => map.resize(), 100);

    map.on("load", () => {
      map.resize();

      // Mapbox native fog — atmosphere around the globe
      map.setFog({
        color: "rgb(10, 10, 16)",
        "high-color": "rgb(0, 8, 20)",
        "horizon-blend": 0.08,
        "space-color": "rgb(0, 0, 0)",
        "star-intensity": 0.5,
      });

      // Trade routes — normal
      map.addSource("routes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: VESSELS.filter((v) => !v.exception).map((v) => ({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [v.loadLon, v.loadLat],
                [v.lon, v.lat],
                [v.dischargeLon, v.dischargeLat],
              ],
            },
          })),
        },
      });
      map.addLayer({
        id: "routes",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#f5a524",
          "line-width": 1,
          "line-opacity": 0.4,
          "line-dasharray": [2, 3],
        },
      });

      // Trade routes — exceptions
      map.addSource("routes-ex", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: VESSELS.filter((v) => v.exception).map((v) => ({
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: [
                [v.loadLon, v.loadLat],
                [v.lon, v.lat],
                [v.dischargeLon, v.dischargeLat],
              ],
            },
          })),
        },
      });
      map.addLayer({
        id: "routes-ex",
        type: "line",
        source: "routes-ex",
        paint: {
          "line-color": "#ef4444",
          "line-width": 1.2,
          "line-opacity": 0.65,
          "line-dasharray": [2, 2],
        },
      });

      // Vessel markers
      VESSELS.forEach((vessel) => {
        const el = document.createElement("div");
        const isEx = vessel.exception;
        Object.assign(el.style, {
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: isEx ? "#ef4444" : "#f5a524",
          cursor: "pointer",
          animation: isEx ? "vcrit 0.9s ease-in-out infinite" : "vpulse 2s ease-in-out infinite",
        });

        const popup = new mapboxgl.Popup({ offset: 14, closeButton: false, maxWidth: "240px" })
          .setHTML(`
            <div style="background:#0f0f0f;border:1px solid #1f1f1f;padding:12px 14px;font-family:'JetBrains Mono',monospace;">
              <div style="color:#f5a524;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:3px;">${vessel.name}</div>
              <div style="color:#525252;font-size:10px;margin-bottom:8px;">IMO ${vessel.imo}</div>
              <div style="color:#f5a524;font-size:10px;margin-bottom:6px;">${vessel.dealRef}</div>
              <div style="color:#c4c4c4;font-size:11px;">${vessel.cargo}</div>
              <div style="color:#525252;font-size:10px;margin-top:3px;">${vessel.loadPort} → ${vessel.dischargePort}</div>
              <div style="color:#8a8a8a;font-size:10px;margin-top:6px;">ETA ${vessel.eta} · ${vessel.speed}kn</div>
              ${isEx ? `<div style="color:#ef4444;font-size:10px;margin-top:6px;text-transform:uppercase;letter-spacing:0.1em;">⚠ ${vessel.exceptionType}</div>` : ""}
            </div>
          `);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setSelected(vessel);
        });

        new mapboxgl.Marker({ element: el })
          .setLngLat([vessel.lon, vessel.lat])
          .setPopup(popup)
          .addTo(map);
      });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const exceptions = VESSELS.filter((v) => v.exception);

  return (
    <>
      <style>{`
        @keyframes vpulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,165,36,0.5), 0 0 8px rgba(245,165,36,0.4); }
          50%      { box-shadow: 0 0 0 5px rgba(245,165,36,0), 0 0 14px rgba(245,165,36,0.6); }
        }
        @keyframes vcrit {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7), 0 0 10px rgba(239,68,68,0.5); }
          40%      { box-shadow: 0 0 0 7px rgba(239,68,68,0), 0 0 18px rgba(239,68,68,0.8); }
        }
        .mapboxgl-popup-content {
          background: #0f0f0f !important;
          border: 1px solid #1f1f1f !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.9) !important;
        }
        .mapboxgl-popup-tip { border-top-color: #0f0f0f !important; border-bottom-color: #0f0f0f !important; }
        .mapboxgl-ctrl-attrib { background: rgba(0,0,0,0.6) !important; font-size: 9px !important; }
        .mapboxgl-ctrl-attrib a { color: #525252 !important; }
        .mapboxgl-ctrl-group {
          background: rgba(15,15,15,0.9) !important;
          border: 1px solid rgba(31,31,31,0.8) !important;
          border-radius: 0 !important;
        }
        .mapboxgl-ctrl-group button { background: transparent !important; filter: invert(0.6); }
        .mapboxgl-ctrl-group button:hover { background: rgba(245,165,36,0.1) !important; }
      `}</style>

      <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)", overflow: "hidden" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

        {/* Top fade */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/75 to-transparent pointer-events-none z-10" />

        {/* Header */}
        <div className="absolute top-5 left-6 z-20">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-1">/ MAP — LIVE</div>
          <h1 className="font-display text-3xl tracking-tight drop-shadow-lg">World book</h1>
        </div>

        {/* Status badges */}
        <div className="absolute top-5 right-6 z-20 flex items-center gap-4">
          {exceptions.length > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-crimson uppercase tracking-wider bg-black/60 px-2.5 py-1 backdrop-blur-sm border border-crimson-muted/40">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              {exceptions.length} exception{exceptions.length > 1 ? "s" : ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-300 bg-black/60 px-2.5 py-1 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
            {VESSELS.length} vessels · 4s ago
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-36 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10" />

        {/* KPI strip */}
        <div className="absolute bottom-6 left-6 right-6 z-20 grid grid-cols-3 gap-px bg-ink-600/40 border border-ink-600/40">
          {[
            { label: "Vessels at sea", value: `${VESSELS.filter(v => v.status === "in_transit").length}`, sub: "in transit", danger: false },
            { label: "Notional", value: "$1.2B", sub: "gross at sea", danger: false },
            { label: "Exceptions", value: `${exceptions.length}`, sub: "needs action", danger: exceptions.length > 0 },
          ].map((k) => (
            <div key={k.label} className="bg-black/70 backdrop-blur-sm px-6 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-2">{k.label}</div>
              <div className={cn("font-display text-3xl text-tabular", k.danger ? "text-crimson" : "text-amber")}>{k.value}</div>
              <div className="font-mono text-[10px] text-ink-500 uppercase tracking-wider mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-[380px] bg-ink border-l border-ink-600/60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-ink-600/60 flex items-center justify-between sticky top-0 bg-ink z-10">
              <div>
                <div className="font-mono text-[10px] text-amber uppercase tracking-wider mb-1">{selected.dealRef}</div>
                <div className="font-mono text-sm text-white">{selected.name}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-ink-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selected.exception && (
                <div className="bg-crimson-muted/20 border border-crimson-muted/40 px-4 py-3">
                  <div className="font-mono text-[10px] text-crimson uppercase tracking-wider mb-1">⚠ Exception</div>
                  <div className="font-mono text-[11px] text-ink-200">{selected.exceptionType}</div>
                </div>
              )}

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Vessel</div>
                <div className="space-y-2">
                  {[
                    ["IMO", selected.imo],
                    ["Speed", `${selected.speed}kn`],
                    ["Status", STATUS_LABEL[selected.status] || selected.status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Trade</div>
                <div className="space-y-2">
                  {[
                    ["Cargo", selected.cargo],
                    ["Quantity", selected.quantity],
                    ["Buyer", selected.buyer],
                    ["Seller", selected.seller],
                    ["Load", selected.loadPort],
                    ["Discharge", selected.dischargePort],
                    ["ETA", selected.eta],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-white text-right max-w-[200px] truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Agent activity</div>
                <div className="divide-y divide-ink-600/30">
                  {[
                    { agent: "Vessel Agent", action: "Position confirmed", time: "4m ago" },
                    { agent: "Document Agent", action: "B/L matched to contract", time: "2h ago" },
                    { agent: "Compliance Agent", action: "Sanctions clear", time: "6h ago" },
                    { agent: "Finance Agent", action: "LC open · $158.9M", time: "1d ago" },
                  ].map((item, i) => (
                    <div key={i} className="py-2.5 flex gap-2.5">
                      <div className="w-1 h-1 rounded-full bg-ink-500 mt-1.5 shrink-0" />
                      <div>
                        <div className="font-mono text-[10px] text-amber">{item.agent}</div>
                        <div className="font-mono text-[10px] text-ink-300">{item.action}</div>
                        <div className="font-mono text-[10px] text-ink-500">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 border border-amber/30 bg-amber/10 text-amber font-mono text-[11px] uppercase tracking-wider py-2.5 hover:bg-amber/20 transition-colors">
                Open deal <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

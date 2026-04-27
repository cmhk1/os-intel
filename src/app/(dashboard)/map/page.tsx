"use client";

import { useState, useEffect, useRef } from "react";
import Map, { Marker, Popup, Source, Layer, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CARTO_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type VesselStatus = "in_transit" | "loading" | "arriving" | "delayed";

interface Vessel {
  id: string;
  name: string;
  imo: string;
  mmsi: string;
  dealRef: string;
  cargo: string;
  quantity: string;
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
  status: VesselStatus;
  exception: boolean;
  exceptionType?: string;
  operator: string;
  animateRoute?: boolean;
}

const VESSELS: Vessel[] = [
  {
    id: "v1", name: "SEAWAYS ENDEAVOR", imo: "9776633", mmsi: "538007623",
    dealRef: "OIL-2026-0142", cargo: "Arab Light", quantity: "2,000,000 BBL",
    loadPort: "RAS TANURA", dischargePort: "FUJAIRAH",
    lat: 25.82, lon: 55.12,
    loadLat: 26.64, loadLon: 50.16, dischargeLat: 25.13, dischargeLon: 56.33,
    speed: "12.4", eta: "29 Apr", status: "in_transit",
    exception: true, exceptionType: "AIS gap · 6h silence",
    operator: "Seaways Crude Transport",
  },
  {
    id: "v2", name: "NEW ADVANCE", imo: "9729395", mmsi: "636018123",
    dealRef: "OIL-2026-0143", cargo: "Upper Zakum", quantity: "1,000,000 BBL",
    loadPort: "DAS ISLAND", dischargePort: "SINGAPORE",
    lat: 4.50, lon: 78.30,
    loadLat: 24.52, loadLon: 52.87, dischargeLat: 1.27, dischargeLon: 103.80,
    speed: "14.1", eta: "28 Apr", status: "loading",
    exception: false, operator: "NYK Line", animateRoute: true,
  },
  {
    id: "v3", name: "STENA IMPULSE", imo: "9820553", mmsi: "352001234",
    dealRef: "OIL-2026-0147", cargo: "Gasoil 10ppm", quantity: "300,000 MT",
    loadPort: "ANTWERP", dischargePort: "ROTTERDAM",
    lat: 51.95, lon: 4.14,
    loadLat: 51.23, loadLon: 4.40, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "0.2", eta: "Arrived", status: "arriving",
    exception: false, operator: "Stena Bulk",
  },
  {
    id: "v4", name: "EAGLE BOSTON", imo: "9465307", mmsi: "636092123",
    dealRef: "OIL-2026-0144", cargo: "Kuwait Export", quantity: "1,200,000 BBL",
    loadPort: "MINA AL AHMADI", dischargePort: "CHIBA",
    lat: 21.00, lon: 75.00,
    loadLat: 29.08, loadLon: 48.13, dischargeLat: 35.60, dischargeLon: 140.08,
    speed: "11.8", eta: "12 May", status: "in_transit",
    exception: false, operator: "AET Tankers", animateRoute: true,
  },
  {
    id: "v5", name: "FRONT ALFA", imo: "9845711", mmsi: "538008901",
    dealRef: "OIL-2026-0145", cargo: "Arab Light", quantity: "1,500,000 BBL",
    loadPort: "RAS TANURA", dischargePort: "AIN SUKHNA",
    lat: 23.12, lon: 39.32,
    loadLat: 26.64, loadLon: 50.16, dischargeLat: 29.57, dischargeLon: 32.55,
    speed: "13.2", eta: "30 Apr", status: "in_transit",
    exception: false, operator: "Frontline",
  },
  {
    id: "v6", name: "NORDIC LUNA", imo: "9504606", mmsi: "257843000",
    dealRef: "OIL-2026-0148", cargo: "HSFO 380", quantity: "80,000 MT",
    loadPort: "FUJAIRAH", dischargePort: "HOUSTON",
    lat: 15.00, lon: 25.00,
    loadLat: 25.13, loadLon: 56.33, dischargeLat: 29.75, dischargeLon: -95.37,
    speed: "13.8", eta: "15 May", status: "in_transit",
    exception: false, operator: "Nordic Tankers", animateRoute: true,
  },
  {
    id: "v7", name: "PACIFIC GRACE", imo: "9597632", mmsi: "477201200",
    dealRef: "OIL-2026-0149", cargo: "Arab Medium", quantity: "2,100,000 BBL",
    loadPort: "JUBAIL", dischargePort: "YOKOHAMA",
    lat: 10.00, lon: 68.00,
    loadLat: 27.01, loadLon: 49.65, dischargeLat: 35.44, dischargeLon: 139.64,
    speed: "14.3", eta: "18 May", status: "in_transit",
    exception: false, operator: "Pacific Basin",
  },
  {
    id: "v8", name: "MINERVA HELEN", imo: "9407800", mmsi: "241374000",
    dealRef: "OIL-2026-0150", cargo: "Basra Heavy", quantity: "1,900,000 BBL",
    loadPort: "BASRA", dischargePort: "ROTTERDAM",
    lat: 29.98, lon: 48.78,
    loadLat: 29.98, loadLon: 48.78, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "0.0", eta: "8 May", status: "loading",
    exception: false, operator: "Minerva Marine",
  },
  {
    id: "v9", name: "GULF LEGEND", imo: "9398535", mmsi: "372301000",
    dealRef: "OIL-2026-0151", cargo: "Upper Zakum", quantity: "800,000 BBL",
    loadPort: "DAS ISLAND", dischargePort: "SINGAPORE",
    lat: 14.00, lon: 62.00,
    loadLat: 24.52, loadLon: 52.87, dischargeLat: 1.27, dischargeLon: 103.80,
    speed: "13.5", eta: "5 May", status: "in_transit",
    exception: false, operator: "Gulf Navigation",
  },
  {
    id: "v10", name: "ALTAIR TRADER", imo: "9543108", mmsi: "305893000",
    dealRef: "OIL-2026-0152", cargo: "Gasoil 50ppm", quantity: "120,000 MT",
    loadPort: "ROTTERDAM", dischargePort: "HOUSTON",
    lat: 44.00, lon: -28.00,
    loadLat: 51.96, loadLon: 4.14, dischargeLat: 29.75, dischargeLon: -95.37,
    speed: "14.0", eta: "3 May", status: "in_transit",
    exception: false, operator: "Altair Shipping", animateRoute: true,
  },
  {
    id: "v11", name: "HANA PIONEER", imo: "9459420", mmsi: "440523000",
    dealRef: "OIL-2026-0153", cargo: "LNG", quantity: "65,000 MT",
    loadPort: "QATARGAS", dischargePort: "TOKYO",
    lat: 18.00, lon: 82.00,
    loadLat: 25.29, loadLon: 51.53, dischargeLat: 35.65, dischargeLon: 139.76,
    speed: "18.2", eta: "2 May", status: "in_transit",
    exception: false, operator: "Hana Shipping",
  },
  {
    id: "v12", name: "SUEZ FORTUNE", imo: "9678234", mmsi: "215430000",
    dealRef: "OIL-2026-0154", cargo: "Arab Light", quantity: "1,800,000 BBL",
    loadPort: "AIN SUKHNA", dischargePort: "ROTTERDAM",
    lat: 34.50, lon: 22.00,
    loadLat: 29.57, loadLon: 32.55, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "13.0", eta: "4 May", status: "in_transit",
    exception: false, operator: "Suez Maritime",
  },
];

const STATUS_STYLES: Record<VesselStatus, string> = {
  in_transit: "text-amber bg-amber-dim/30 border-amber-muted/50",
  loading: "text-azure bg-azure-muted/20 border-azure-muted/50",
  arriving: "text-emerald bg-emerald-muted/30 border-emerald-muted",
  delayed: "text-crimson bg-crimson-muted/30 border-crimson-muted",
};

const DASH_SEQUENCE = [
  [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5],
  [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
  [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5],
  [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1],
  [0, 3.5, 3, 0.5], [0, 4, 3, 0],
];

function buildGeoJSON(vessels: Vessel[]) {
  return {
    type: "FeatureCollection" as const,
    features: vessels.map((v) => ({
      type: "Feature" as const,
      properties: { id: v.id },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [v.loadLon, v.loadLat],
          [v.lon, v.lat],
          [v.dischargeLon, v.dischargeLat],
        ],
      },
    })),
  };
}

export default function MapPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [popupVessel, setPopupVessel] = useState<Vessel | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);
  const [dashStep, setDashStep] = useState(0);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    const id = setInterval(() => setDashStep((s) => (s + 1) % DASH_SEQUENCE.length), 80);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const map = mapRef.current?.getMap();
      if (map?.isStyleLoaded()) {
        map.setPaintProperty("routes-animated", "line-dasharray", DASH_SEQUENCE[dashStep]);
      }
    } catch {}
  }, [dashStep]);

  const regularVessels = VESSELS.filter((v) => !v.exception && !v.animateRoute);
  const animatedVessels = VESSELS.filter((v) => !v.exception && v.animateRoute);
  const exceptionVessels = VESSELS.filter((v) => v.exception);

  return (
    <>
      <style>{`
        @keyframes vessel-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,165,36,0.6),0 0 6px rgba(245,165,36,0.3); }
          50% { box-shadow: 0 0 0 5px rgba(245,165,36,0),0 0 10px rgba(245,165,36,0.5); }
        }
        @keyframes vessel-pulse-critical {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.8),0 0 8px rgba(239,68,68,0.5); }
          40% { box-shadow: 0 0 0 7px rgba(239,68,68,0),0 0 14px rgba(239,68,68,0.7); }
        }
        .v-dot { animation: vessel-pulse 2s ease-in-out infinite; }
        .v-dot-crit { animation: vessel-pulse-critical 0.9s ease-in-out infinite; }
        .maplibregl-popup-content {
          background: #0f0f0f !important;
          border: 1px solid rgba(31,31,31,0.9) !important;
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.9) !important;
        }
        .maplibregl-popup-tip { border-top-color: #0f0f0f !important; border-bottom-color: #0f0f0f !important; }
        .maplibregl-popup-close-button { color: #525252 !important; padding: 4px 8px !important; }
        .maplibregl-popup-close-button:hover { color: #f5a524 !important; background: none !important; }
        .maplibregl-ctrl-logo, .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>

      <div className="p-8 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-2">/ MAP — LIVE</div>
            <h1 className="font-display text-4xl tracking-tight">World book</h1>
          </div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-px border border-ink-600/60">
              {["All", "Crude", "Products", "LNG", "Disputed"].map((tab, i) => (
                <button
                  key={tab}
                  className={cn(
                    "font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 transition-colors",
                    i === 0 ? "bg-amber text-ink-900" : "text-ink-400 hover:text-white hover:bg-ink-700/60"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-ink-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              {VESSELS.length} vessels live · last update 4s ago
            </div>
          </div>
        </div>

        {/* Map + right panel */}
        <div className="flex gap-4 mb-6" style={{ height: "65vh" }}>
          <div className="flex-1 relative overflow-hidden border border-ink-600/60">
            <Map
              ref={mapRef}
              initialViewState={{ longitude: 45, latitude: 18, zoom: 1.9 }}
              style={{ width: "100%", height: "100%" }}
              mapStyle={CARTO_DARK}
              dragRotate={false}
              pitchWithRotate={false}
              attributionControl={false}
            >
              {/* Regular routes */}
              <Source id="routes-regular" type="geojson" data={buildGeoJSON(regularVessels)}>
                <Layer
                  id="routes-regular"
                  type="line"
                  paint={{ "line-color": "#f5a524", "line-width": 1, "line-dasharray": [2, 2], "line-opacity": 0.3 } as any}
                />
              </Source>

              {/* Animated routes */}
              <Source id="routes-animated-src" type="geojson" data={buildGeoJSON(animatedVessels)}>
                <Layer
                  id="routes-animated"
                  type="line"
                  paint={{ "line-color": "#f5a524", "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": 0.5 } as any}
                />
              </Source>

              {/* Exception routes */}
              <Source id="routes-exception" type="geojson" data={buildGeoJSON(exceptionVessels)}>
                <Layer
                  id="routes-exception"
                  type="line"
                  paint={{ "line-color": "#ef4444", "line-width": 1.5, "line-dasharray": [2, 2], "line-opacity": 0.6 } as any}
                />
              </Source>

              {/* Markers */}
              {VESSELS.map((v) => (
                <Marker key={v.id} longitude={v.lon} latitude={v.lat} anchor="center">
                  <div
                    className={cn(
                      "rounded-full cursor-pointer transition-all duration-150",
                      v.exception ? "v-dot-crit bg-crimson" : "v-dot bg-amber",
                      hoveredId === v.id || selectedVessel?.id === v.id ? "w-4 h-4" : "w-2.5 h-2.5"
                    )}
                    onMouseEnter={() => { setHoveredId(v.id); setPopupVessel(v); }}
                    onMouseLeave={() => { setHoveredId(null); setPopupVessel(null); }}
                    onClick={() => { setSelectedVessel(v); setPopupVessel(null); }}
                  />
                </Marker>
              ))}

              {/* Hover popup */}
              {popupVessel && (
                <Popup
                  longitude={popupVessel.lon}
                  latitude={popupVessel.lat}
                  anchor="bottom"
                  closeButton={false}
                  closeOnClick={false}
                  offset={14}
                >
                  <div className="px-3 py-2.5 min-w-[190px]">
                    <div className="font-mono text-[11px] text-white mb-0.5">{popupVessel.name}</div>
                    <div className="font-mono text-[10px] text-ink-500 mb-2">IMO {popupVessel.imo}</div>
                    <div className="font-mono text-[10px] text-amber mb-1">{popupVessel.dealRef}</div>
                    <div className="font-mono text-[10px] text-ink-300">{popupVessel.cargo} · {popupVessel.quantity}</div>
                    <div className="font-mono text-[10px] text-ink-400 mt-1">{popupVessel.loadPort} → {popupVessel.dischargePort}</div>
                    <div className="flex gap-3 mt-1.5 font-mono text-[10px] text-ink-400">
                      <span>ETA {popupVessel.eta}</span>
                      <span>·</span>
                      <span>{popupVessel.speed}kn</span>
                    </div>
                    {popupVessel.exception && (
                      <div className="mt-2 font-mono text-[10px] text-crimson uppercase tracking-wider">⚠ {popupVessel.exceptionType}</div>
                    )}
                  </div>
                </Popup>
              )}
            </Map>
          </div>

          {/* Right vessel panel */}
          <div className="w-[360px] bg-ink-800/50 border border-ink-600/60 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-ink-600/60 shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-300">
                Active Vessels · {VESSELS.length}
              </span>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-ink-600/40">
              {VESSELS.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-colors",
                    hoveredId === v.id ? "bg-ink-700/60" : "hover:bg-ink-700/40",
                    selectedVessel?.id === v.id && "bg-amber/5 border-l-2 border-l-amber"
                  )}
                  onMouseEnter={() => setHoveredId(v.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedVessel(v)}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[11px] text-white truncate pr-2">{v.name}</span>
                    <span className={cn(
                      "font-mono text-[10px] uppercase px-1.5 py-0.5 border tracking-wider shrink-0",
                      v.exception
                        ? "text-crimson bg-crimson-muted/20 border-crimson-muted/50"
                        : STATUS_STYLES[v.status]
                    )}>
                      {v.exception ? "AIS gap" : v.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-amber">{v.dealRef}</div>
                  <div className="font-mono text-[10px] text-ink-400 mt-0.5">{v.loadPort} → {v.dischargePort}</div>
                  <div className="flex gap-3 font-mono text-[10px] text-ink-500 mt-0.5">
                    <span>IMO {v.imo}</span>
                    <span>·</span>
                    <span>ETA {v.eta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-px bg-ink-600/60 border border-ink-600/60">
          {[
            { label: "Vessels in transit", value: "8", sub: "active routes", accent: true },
            { label: "Notional at sea", value: "$1.2B", sub: "gross value", accent: true },
            { label: "Exceptions", value: "1", sub: "needs attention", danger: true },
          ].map((k) => (
            <div key={k.label} className="bg-ink p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">{k.label}</div>
              <div className={cn("font-display text-4xl text-tabular", k.danger ? "text-crimson" : "text-amber")}>{k.value}</div>
              <div className="font-mono text-[10px] text-ink-400 uppercase tracking-wider mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-over */}
      {selectedVessel && (
        <div className="fixed inset-0 z-50" onClick={() => setSelectedVessel(null)}>
          <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-[400px] bg-ink border-l border-ink-600/60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-ink-600/60 flex items-center justify-between sticky top-0 bg-ink z-10">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-amber mb-1">{selectedVessel.dealRef}</div>
                <div className="font-mono text-sm text-white">{selectedVessel.name}</div>
              </div>
              <button onClick={() => setSelectedVessel(null)} className="text-ink-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedVessel.exception && (
                <div className="bg-crimson-muted/20 border border-crimson-muted/40 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-crimson mb-1">⚠ Exception</div>
                  <div className="text-sm text-ink-200">{selectedVessel.exceptionType}</div>
                </div>
              )}

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Vessel</div>
                <div className="space-y-2">
                  {[
                    ["IMO", selectedVessel.imo],
                    ["MMSI", selectedVessel.mmsi],
                    ["Operator", selectedVessel.operator],
                    ["Speed", `${selectedVessel.speed}kn`],
                  ].map(([k, val]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Cargo</div>
                <div className="space-y-2">
                  {[
                    ["Commodity", selectedVessel.cargo],
                    ["Quantity", selectedVessel.quantity],
                    ["Load port", selectedVessel.loadPort],
                    ["Discharge", selectedVessel.dischargePort],
                    ["ETA", selectedVessel.eta],
                  ].map(([k, val]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Recent activity</div>
                <div className="space-y-0 divide-y divide-ink-600/30">
                  {[
                    { agent: "Vessel Agent", action: "Position update received", time: "4m ago", err: false },
                    { agent: "Document Agent", action: "B/L parsed · all fields match contract", time: "2h ago", err: false },
                    { agent: "Compliance Agent", action: "Sanctions check passed", time: "6h ago", err: false },
                    { agent: "Quality Agent", action: "COA received · spec within tolerance", time: "1d ago", err: false },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-2.5 py-2.5">
                      <div className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", item.err ? "bg-crimson" : "bg-ink-500")} />
                      <div>
                        <div className="font-mono text-[10px] text-amber">{item.agent}</div>
                        <div className="font-mono text-[10px] text-ink-300">{item.action}</div>
                        <div className="font-mono text-[10px] text-ink-500">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-amber/10 border border-amber/30 text-amber font-mono text-[11px] uppercase tracking-wider px-4 py-2.5 hover:bg-amber/20 transition-colors">
                Open deal <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

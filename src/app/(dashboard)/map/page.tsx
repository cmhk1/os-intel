"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { X, ChevronRight, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VesselDisplay {
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
  heading: number;
  eta: string;
  status: string;
  exception: boolean;
  exceptionType?: string;
  live: boolean;
}

// ─── Static commercial data ───────────────────────────────────────────────────

const STATIC: Omit<VesselDisplay, "live">[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "SEAWAYS ENDEAVOR", imo: "9776633",
    dealRef: "OIL-2026-0142", cargo: "Arab Light", quantity: "2,000,000 BBL",
    buyer: "Vitol S.A.", seller: "Saudi Aramco Trading",
    loadPort: "RAS TANURA", dischargePort: "FUJAIRAH",
    lat: 25.82, lon: 55.12, heading: 92,
    loadLat: 26.64, loadLon: 50.16, dischargeLat: 25.13, dischargeLon: 56.33,
    speed: "12.4", eta: "29 Apr", status: "in_transit",
    exception: true, exceptionType: "AIS gap · 6h silence",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "NEW ADVANCE", imo: "9729395",
    dealRef: "OIL-2026-0143", cargo: "Upper Zakum", quantity: "1,000,000 BBL",
    buyer: "Trafigura Pte Ltd", seller: "ADNOC Global Trading",
    loadPort: "DAS ISLAND", dischargePort: "SINGAPORE",
    lat: 4.50, lon: 78.30, heading: 135,
    loadLat: 24.52, loadLon: 52.87, dischargeLat: 1.27, dischargeLon: 103.80,
    speed: "14.1", eta: "28 Apr", status: "in_transit",
    exception: false,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "STENA IMPULSE", imo: "9820553",
    dealRef: "OIL-2026-0147", cargo: "Gasoil 10ppm", quantity: "300,000 MT",
    buyer: "Gunvor Group", seller: "Saudi Aramco Trading",
    loadPort: "ANTWERP", dischargePort: "ROTTERDAM",
    lat: 51.95, lon: 4.14, heading: 0,
    loadLat: 51.23, loadLon: 4.40, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "0.2", eta: "Arrived", status: "arriving",
    exception: false,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "EAGLE BOSTON", imo: "9465307",
    dealRef: "OIL-2026-0144", cargo: "Kuwait Export", quantity: "1,200,000 BBL",
    buyer: "Vitol S.A.", seller: "KPC Kuwait Petroleum",
    loadPort: "MINA AL AHMADI", dischargePort: "CHIBA",
    lat: 21.00, lon: 75.00, heading: 75,
    loadLat: 29.08, loadLon: 48.13, dischargeLat: 35.60, dischargeLon: 140.08,
    speed: "11.8", eta: "12 May", status: "in_transit",
    exception: false,
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    name: "FRONT ALFA", imo: "9845711",
    dealRef: "OIL-2026-0145", cargo: "Arab Light", quantity: "1,500,000 BBL",
    buyer: "Trafigura Pte Ltd", seller: "Saudi Aramco Trading",
    loadPort: "RAS TANURA", dischargePort: "AIN SUKHNA",
    lat: 23.12, lon: 39.32, heading: 45,
    loadLat: 26.64, loadLon: 50.16, dischargeLat: 29.57, dischargeLon: 32.55,
    speed: "13.2", eta: "30 Apr", status: "in_transit",
    exception: false,
  },
  {
    id: "v6", name: "NORDIC LUNA", imo: "9504606",
    dealRef: "OIL-2026-0148", cargo: "HSFO 380", quantity: "80,000 MT",
    buyer: "Gunvor Group", seller: "ADNOC Global Trading",
    loadPort: "FUJAIRAH", dischargePort: "HOUSTON",
    lat: 15.00, lon: 25.00, heading: 300,
    loadLat: 25.13, loadLon: 56.33, dischargeLat: 29.75, dischargeLon: -95.37,
    speed: "13.8", eta: "15 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v7", name: "PACIFIC GRACE", imo: "9597632",
    dealRef: "OIL-2026-0149", cargo: "Arab Medium", quantity: "2,100,000 BBL",
    buyer: "Trafigura Pte Ltd", seller: "ADNOC Global Trading",
    loadPort: "JUBAIL", dischargePort: "YOKOHAMA",
    lat: 10.00, lon: 68.00, heading: 70,
    loadLat: 27.01, loadLon: 49.65, dischargeLat: 35.44, dischargeLon: 139.64,
    speed: "14.3", eta: "18 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v8", name: "MINERVA HELEN", imo: "9407800",
    dealRef: "OIL-2026-0150", cargo: "Basra Heavy", quantity: "1,900,000 BBL",
    buyer: "Vitol S.A.", seller: "KPC Kuwait Petroleum",
    loadPort: "BASRA", dischargePort: "ROTTERDAM",
    lat: 29.98, lon: 48.78, heading: 0,
    loadLat: 29.98, loadLon: 48.78, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "0.0", eta: "8 May", status: "loading",
    exception: false,
  },
  {
    id: "v9", name: "GULF LEGEND", imo: "9398535",
    dealRef: "OIL-2026-0151", cargo: "Upper Zakum", quantity: "800,000 BBL",
    buyer: "Gunvor Group", seller: "ADNOC Global Trading",
    loadPort: "DAS ISLAND", dischargePort: "SINGAPORE",
    lat: 14.00, lon: 62.00, heading: 115,
    loadLat: 24.52, loadLon: 52.87, dischargeLat: 1.27, dischargeLon: 103.80,
    speed: "13.5", eta: "5 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v10", name: "ALTAIR TRADER", imo: "9543108",
    dealRef: "OIL-2026-0152", cargo: "Gasoil 50ppm", quantity: "120,000 MT",
    buyer: "Vitol S.A.", seller: "Saudi Aramco Trading",
    loadPort: "ROTTERDAM", dischargePort: "HOUSTON",
    lat: 44.00, lon: -28.00, heading: 270,
    loadLat: 51.96, loadLon: 4.14, dischargeLat: 29.75, dischargeLon: -95.37,
    speed: "14.0", eta: "3 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v11", name: "HANA PIONEER", imo: "9459420",
    dealRef: "OIL-2026-0153", cargo: "LNG", quantity: "65,000 MT",
    buyer: "Trafigura Pte Ltd", seller: "ADNOC Global Trading",
    loadPort: "QATARGAS", dischargePort: "TOKYO",
    lat: 18.00, lon: 82.00, heading: 60,
    loadLat: 25.29, loadLon: 51.53, dischargeLat: 35.65, dischargeLon: 139.76,
    speed: "18.2", eta: "2 May", status: "in_transit",
    exception: false,
  },
  {
    id: "v12", name: "SUEZ FORTUNE", imo: "9678234",
    dealRef: "OIL-2026-0154", cargo: "Arab Light", quantity: "1,800,000 BBL",
    buyer: "Gunvor Group", seller: "Saudi Aramco Trading",
    loadPort: "AIN SUKHNA", dischargePort: "ROTTERDAM",
    lat: 34.50, lon: 22.00, heading: 315,
    loadLat: 29.57, loadLon: 32.55, dischargeLat: 51.96, dischargeLon: 4.14,
    speed: "13.0", eta: "4 May", status: "in_transit",
    exception: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  in_transit: "#f5a524",
  "under way using engine": "#f5a524",
  loading: "#3b82f6",
  arriving: "#10b981",
  moored: "#6b7280",
  delayed: "#ef4444",
};

function vesselColor(status: string, exception: boolean): string {
  if (exception) return "#ef4444";
  return STATUS_COLOR[status.toLowerCase()] ?? "#f5a524";
}

function relativeTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// Circle + directional arrowhead, rotated to heading direction
function makeMarkerEl(color: string, heading: number, exception: boolean): HTMLElement {
  // 40x40 container with circle+arrowhead centred at (20,20) so MapLibre's
  // anchor:"center" maps exactly to the vessel's lat/lon with no drift.
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:40px;height:40px;cursor:pointer;";

  const glow = document.createElement("div");
  glow.className = exception ? "vex-glow" : "vnorm-glow";
  glow.style.cssText = `position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.18;pointer-events:none;`;
  wrap.appendChild(glow);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 40 40");
  svg.setAttribute("width", "40");
  svg.setAttribute("height", "40");
  svg.style.cssText = `position:absolute;inset:0;transform:rotate(${heading}deg);transform-origin:20px 20px;`;
  svg.innerHTML = `
    <circle cx="20" cy="20" r="5" fill="${color}" stroke="rgba(0,0,0,0.55)" stroke-width="1.5"/>
    <polygon points="20,9 17,16 23,16" fill="${color}" opacity="0.85"/>
  `;
  wrap.appendChild(svg);
  return wrap;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; svg: SVGSVGElement }>>(new Map());

  const [vessels, setVessels] = useState<VesselDisplay[]>([]);
  const [selected, setSelected] = useState<VesselDisplay | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick] = useState(0);

  const mergeWithLive = useCallback((rows: Record<string, unknown>[]): VesselDisplay[] => {
    const merged = STATIC.map((s) => ({ ...s, live: false }));
    for (const row of rows) {
      const idx = merged.findIndex((v) => v.imo === row.imo || v.id === row.id);
      if (idx < 0) continue;
      const rawStatus = String(row.last_status ?? "").toLowerCase().replace(/ /g, "_");
      merged[idx] = {
        ...merged[idx],
        lat: Number(row.last_position_lat) || merged[idx].lat,
        lon: Number(row.last_position_lon) || merged[idx].lon,
        heading: Number(row.last_heading) || merged[idx].heading,
        speed: String(row.last_speed ?? merged[idx].speed),
        status: rawStatus || merged[idx].status,
        exception: Number(row.ais_gaps_24h) > 0,
        exceptionType: Number(row.ais_gaps_24h) > 0 ? `AIS gap · ${row.ais_gaps_24h} gaps in 24h` : undefined,
        live: true,
      };
    }
    return merged;
  }, []);

  const patchMarker = useCallback((id: string, lat: number, lon: number, heading: number, color: string) => {
    const entry = markersRef.current.get(id);
    if (!entry) return;
    entry.marker.setLngLat([lon, lat]);
    entry.svg.style.transform = `rotate(${heading}deg)`;
    entry.svg.querySelectorAll("circle,polygon").forEach((el) => el.setAttribute("fill", color));
  }, []);

  const buildMarkers = useCallback((map: maplibregl.Map, list: VesselDisplay[], onSelect: (v: VesselDisplay) => void) => {
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    list.forEach((v) => {
      const color = vesselColor(v.status, v.exception);
      const el = makeMarkerEl(color, v.heading, v.exception);
      const svg = el.querySelector("svg") as SVGSVGElement;

      el.addEventListener("click", (e) => { e.stopPropagation(); onSelect(v); });

      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([v.lon, v.lat])
        .addTo(map);

      markersRef.current.set(v.id, { marker, svg });
    });
  }, []);

  // ── Map init + data ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [52, 22],
      zoom: 1.6,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;
    setTimeout(() => map.resize(), 100);

    map.on("load", async () => {
      map.resize();
      try { (map as maplibregl.Map & { setProjection(p: unknown): void }).setProjection({ type: "globe" }); } catch { /* */ }
      try {
        (map as unknown as { setFog(f: unknown): void }).setFog({
          color: "rgba(10,10,10,0.5)", "high-color": "#000a14",
          "horizon-blend": 0.06, "space-color": "#000000", "star-intensity": 0.45,
        });
      } catch { /* */ }

      // Fetch live positions
      const supabase = createBrowserClient();
      const { data: rows } = await supabase
        .from("vessels")
        .select("id,imo,name,last_position_lat,last_position_lon,last_position_at,last_speed,last_heading,last_status,ais_gaps_24h");

      const list = mergeWithLive((rows ?? []) as Record<string, unknown>[]);
      setVessels(list);
      setLastUpdated(new Date());

      // Route lines
      const routeFeatures = (exception: boolean) =>
        list.filter((v) => v.exception === exception).map((v) => ({
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: [[v.loadLon, v.loadLat], [v.lon, v.lat], [v.dischargeLon, v.dischargeLat]],
          },
        }));

      map.addSource("routes", { type: "geojson", data: { type: "FeatureCollection", features: routeFeatures(false) } });
      map.addLayer({ id: "routes", type: "line", source: "routes", paint: { "line-color": "#f5a524", "line-width": 0.8, "line-opacity": 0.28, "line-dasharray": [2, 3] } as maplibregl.LinePaint });
      map.addSource("routes-ex", { type: "geojson", data: { type: "FeatureCollection", features: routeFeatures(true) } });
      map.addLayer({ id: "routes-ex", type: "line", source: "routes-ex", paint: { "line-color": "#ef4444", "line-width": 1, "line-opacity": 0.5, "line-dasharray": [2, 2] } as maplibregl.LinePaint });

      buildMarkers(map, list, setSelected);

      // Realtime: patch individual markers when AIS ingest updates a vessel
      const channel = supabase
        .channel("live-vessels")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vessels" }, (payload) => {
          const row = payload.new as Record<string, unknown>;
          const rowId = String(row.id ?? "");
          const staticEntry = STATIC.find((s) => s.imo === row.imo || s.id === rowId);
          const targetId = staticEntry?.id ?? rowId;
          if (!targetId) return;

          const rawStatus = String(row.last_status ?? "").toLowerCase().replace(/ /g, "_");
          const isException = Number(row.ais_gaps_24h) > 0;
          const color = vesselColor(rawStatus, isException);
          const newLat = Number(row.last_position_lat);
          const newLon = Number(row.last_position_lon);
          const newHeading = Number(row.last_heading) || 0;

          patchMarker(targetId, newLat, newLon, newHeading, color);

          setVessels((prev) =>
            prev.map((v) =>
              v.id === targetId
                ? { ...v, lat: newLat, lon: newLon, heading: newHeading, speed: String(row.last_speed ?? v.speed), status: rawStatus || v.status, exception: isException, exceptionType: isException ? `AIS gap · ${row.ais_gaps_24h} gaps in 24h` : undefined, live: true }
                : v
            )
          );
          setLastUpdated(new Date());
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "vessels" }, (payload) => {
          const deletedId = String((payload.old as Record<string, unknown>).id ?? "");
          if (!deletedId) return;
          const entry = markersRef.current.get(deletedId);
          if (entry) { entry.marker.remove(); markersRef.current.delete(deletedId); }
          setVessels((prev) => prev.filter((v) => v.id !== deletedId));
          setSelected((prev) => (prev?.id === deletedId ? null : prev));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [buildMarkers, mergeWithLive, patchMarker]);

  // Keep relative timestamps fresh every 30s
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Listen for vessels added via Cmd+K search
  useEffect(() => {
    const handler = (e: Event) => {
      const vessel = (e as CustomEvent).detail as {
        id: string; mmsi: string; name: string;
        last_position_lat: number; last_position_lon: number;
        last_speed: number; last_heading: number; last_status: string;
      };
      if (!mapRef.current) return;

      const newVessel: VesselDisplay = {
        id: vessel.id,
        name: vessel.name,
        imo: vessel.mmsi,
        dealRef: "—",
        cargo: "—",
        quantity: "—",
        buyer: "—",
        seller: "—",
        loadPort: "—",
        dischargePort: "—",
        lat: vessel.last_position_lat,
        lon: vessel.last_position_lon,
        heading: vessel.last_heading ?? 0,
        speed: String(vessel.last_speed ?? 0),
        eta: "—",
        status: (vessel.last_status ?? "in_transit").toLowerCase().replace(/ /g, "_"),
        exception: false,
        loadLat: vessel.last_position_lat,
        loadLon: vessel.last_position_lon,
        dischargeLat: vessel.last_position_lat,
        dischargeLon: vessel.last_position_lon,
        live: true,
      };

      const color = vesselColor(newVessel.status, false);
      const el = makeMarkerEl(color, newVessel.heading, false);
      const svg = el.querySelector("svg") as SVGSVGElement;
      el.addEventListener("click", (ev) => { ev.stopPropagation(); setSelected(newVessel); });
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([newVessel.lon, newVessel.lat])
        .addTo(mapRef.current);
      markersRef.current.set(newVessel.id, { marker, svg });

      setVessels((prev) => {
        const exists = prev.find((v) => v.id === newVessel.id);
        return exists ? prev.map((v) => v.id === newVessel.id ? newVessel : v) : [...prev, newVessel];
      });

      mapRef.current.flyTo({ center: [newVessel.lon, newVessel.lat], zoom: 5, duration: 1500 });
      setSelected(newVessel);
      setLastUpdated(new Date());
    };

    window.addEventListener("os:vessel-found", handler);
    return () => window.removeEventListener("os:vessel-found", handler);
  }, []); // intentionally empty deps — uses refs not state

  const exceptions = vessels.filter((v) => v.exception);
  const liveCount = vessels.filter((v) => v.live).length;

  return (
    <>
      <style>{`
        @keyframes vnorm { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.06;transform:scale(1.7)} }
        @keyframes vex   { 0%,100%{opacity:.28;transform:scale(1)} 40%{opacity:.1;transform:scale(1.9)} }
        .vnorm-glow{animation:vnorm 2.6s ease-in-out infinite}
        .vex-glow  {animation:vex   0.85s ease-in-out infinite}
        .maplibregl-popup-content{background:#0c0c0c!important;border:1px solid #222!important;border-radius:0!important;padding:0!important;box-shadow:0 12px 40px rgba(0,0,0,.95)!important}
        .maplibregl-popup-tip{border-top-color:#0c0c0c!important;border-bottom-color:#0c0c0c!important}
        .maplibregl-ctrl-logo,.maplibregl-ctrl-attrib{display:none!important}
        .maplibregl-ctrl-group{background:rgba(12,12,12,.9)!important;border:1px solid rgba(40,40,40,.8)!important;border-radius:0!important}
        .maplibregl-ctrl-group button{background:transparent!important;filter:invert(.6)}
        .maplibregl-ctrl-group button:hover{background:rgba(245,165,36,.1)!important}
      `}</style>

      <div style={{ position: "relative", width: "100%", height: "calc(100vh - 56px)", overflow: "hidden" }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {/* Top vignette */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

        {/* Header */}
        <div className="absolute top-5 left-6 z-20">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber mb-1">/ MAP — LIVE</div>
          <h1 className="font-display text-3xl tracking-tight drop-shadow-lg">World book</h1>
        </div>

        {/* Status strip — top right */}
        <div className="absolute top-5 right-6 z-20 flex items-center gap-3">
          {exceptions.length > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-crimson uppercase tracking-wider bg-black/70 px-2.5 py-1.5 border border-crimson/30 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              {exceptions.length} exception{exceptions.length !== 1 ? "s" : ""}
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono text-[10px] bg-black/70 px-2.5 py-1.5 border border-ink-600/40 backdrop-blur-sm">
            <Radio className={cn("w-3 h-3", liveCount > 0 ? "text-emerald" : "text-ink-500")} />
            <span className={liveCount > 0 ? "text-emerald" : "text-ink-400"}>
              {liveCount > 0 ? `${liveCount} live` : "connecting"}
            </span>
            {lastUpdated && (
              <span className="text-ink-500 ml-1" suppressHydrationWarning>
                · {relativeTime(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10" />

        {/* KPI strip */}
        <div className="absolute bottom-6 left-6 right-6 z-20 grid grid-cols-3 gap-px bg-ink-600/30 border border-ink-600/30">
          {[
            { label: "Vessels at sea", value: String(vessels.filter((v) => v.status === "in_transit" || v.status === "under_way_using_engine").length), sub: "in transit", danger: false },
            { label: "Notional", value: "$1.2B", sub: "gross at sea", danger: false },
            { label: "Exceptions", value: String(exceptions.length), sub: "needs action", danger: exceptions.length > 0 },
          ].map((k) => (
            <div key={k.label} className="bg-black/75 backdrop-blur-sm px-6 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-2">{k.label}</div>
              <div className={cn("font-display text-3xl text-tabular", k.danger ? "text-crimson" : "text-amber")}>{k.value}</div>
              <div className="font-mono text-[10px] text-ink-500 uppercase tracking-wider mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vessel detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute right-0 top-0 h-full w-[380px] bg-ink border-l border-ink-600/60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-ink-600/60 flex items-center justify-between sticky top-0 bg-ink z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-amber uppercase tracking-wider">{selected.dealRef}</span>
                  {selected.live && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-emerald animate-pulse" /> live
                    </span>
                  )}
                </div>
                <div className="font-mono text-sm text-white">{selected.name}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-ink-400 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selected.exception && (
                <div className="bg-crimson/5 border border-crimson/30 px-4 py-3">
                  <div className="font-mono text-[10px] text-crimson uppercase tracking-wider mb-1">⚠ Exception</div>
                  <div className="font-mono text-[11px] text-ink-200">{selected.exceptionType}</div>
                </div>
              )}

              <section>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Vessel</div>
                <div className="space-y-2">
                  {([["IMO", selected.imo], ["Speed", `${selected.speed} kn`], ["Heading", `${selected.heading}°`], ["Status", selected.status.replace(/_/g, " ")]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Trade</div>
                <div className="space-y-2">
                  {([["Cargo", selected.cargo], ["Quantity", selected.quantity], ["Buyer", selected.buyer], ["Seller", selected.seller], ["Load", selected.loadPort], ["Discharge", selected.dischargePort], ["ETA", selected.eta]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between font-mono text-[11px]">
                      <span className="text-ink-400">{k}</span>
                      <span className="text-white text-right max-w-[200px] truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-3">Agent activity</div>
                <div className="divide-y divide-ink-600/30">
                  {[
                    { agent: "VesselAgent", action: "Position confirmed", time: "4m ago" },
                    { agent: "DocumentAgent", action: "B/L matched to contract", time: "2h ago" },
                    { agent: "ComplianceAgent", action: "Sanctions clear", time: "6h ago" },
                    { agent: "FinanceAgent", action: "LC open · $158.9M", time: "1d ago" },
                  ].map((item) => (
                    <div key={item.agent} className="py-2.5 flex gap-3">
                      <span className="w-1 h-1 rounded-full bg-ink-500 mt-2 shrink-0" />
                      <div>
                        <div className="font-mono text-[10px] text-amber">{item.agent}</div>
                        <div className="font-mono text-[10px] text-ink-300">{item.action}</div>
                        <div className="font-mono text-[10px] text-ink-500">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

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

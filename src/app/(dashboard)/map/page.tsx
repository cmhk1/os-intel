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
  "under way sailing": "#f5a524",
  loading: "#3b82f6",
  arriving: "#10b981",
  moored: "#6b7280",
  "at anchor": "#6b7280",
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

// Build a white upward-pointing arrow on a transparent canvas for SDF icon use.
// SDF (Signed Distance Field) lets MapLibre recolor the icon via icon-color.
function buildArrowImageData(): { width: number; height: number; data: Uint8Array } {
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(12, 3);   // tip
  ctx.lineTo(7, 20);   // bottom-left
  ctx.lineTo(12, 16);  // inner notch
  ctx.lineTo(17, 20);  // bottom-right
  ctx.closePath();
  ctx.fill();
  const d = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: new Uint8Array(d.data.buffer) };
}

// Convert the vessel list to a GeoJSON FeatureCollection for the map source.
function toGeoJSON(list: VesselDisplay[]) {
  return {
    type: "FeatureCollection" as const,
    features: list.map((v) => ({
      type: "Feature" as const,
      properties: {
        id: v.id,
        color: vesselColor(v.status, v.exception),
        heading: v.heading,
      },
      geometry: { type: "Point" as const, coordinates: [v.lon, v.lat] },
    })),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<maplibregl.Map | null>(null);
  // Stable ref so click handlers always see the latest vessel list without stale closures.
  const vesselsRef   = useRef<VesselDisplay[]>([]);

  const [vessels, setVessels]         = useState<VesselDisplay[]>([]);
  const [selected, setSelected]       = useState<VesselDisplay | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setTick]                   = useState(0);

  // Keep ref in sync with state on every render.
  useEffect(() => { vesselsRef.current = vessels; }, [vessels]);

  // Whenever the vessel list changes, push the updated GeoJSON into the map source.
  // This single effect replaces all per-operation marker manipulation.
  useEffect(() => {
    const src = mapRef.current?.getSource("vessels-src") as maplibregl.GeoJSONSource | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    src?.setData(toGeoJSON(vessels) as any);
  }, [vessels]);

  // Build display list from DB rows (source of truth), enriched with STATIC trade data where IMO matches.
  const mergeWithLive = useCallback((rows: Record<string, unknown>[]): VesselDisplay[] => {
    return rows
      .filter((row) => row.last_position_lat != null && row.last_position_lon != null)
      .map((row) => {
        const trade = STATIC.find((s) => s.imo === String(row.imo ?? ""));
        const rawStatus = String(row.last_status ?? "").toLowerCase().replace(/ /g, "_");
        const lat = Number(row.last_position_lat);
        const lon = Number(row.last_position_lon);
        return {
          id:            String(row.id),
          name:          String(row.name ?? trade?.name ?? `MMSI ${row.mmsi ?? ""}`),
          imo:           String(row.imo ?? trade?.imo ?? String(row.mmsi ?? "")),
          dealRef:       trade?.dealRef       ?? "—",
          cargo:         trade?.cargo         ?? "—",
          quantity:      trade?.quantity      ?? "—",
          buyer:         trade?.buyer         ?? "—",
          seller:        trade?.seller        ?? "—",
          loadPort:      trade?.loadPort      ?? "—",
          dischargePort: trade?.dischargePort ?? "—",
          lat,
          lon,
          heading:       Number(row.last_heading) || trade?.heading || 0,
          speed:         String(row.last_speed ?? trade?.speed ?? "0"),
          eta:           trade?.eta ?? "—",
          status:        rawStatus || trade?.status || "in_transit",
          exception:     Number(row.ais_gaps_24h) > 0,
          exceptionType: Number(row.ais_gaps_24h) > 0 ? `AIS gap · ${row.ais_gaps_24h} gaps in 24h` : undefined,
          loadLat:       trade?.loadLat       ?? lat,
          loadLon:       trade?.loadLon       ?? lon,
          dischargeLat:  trade?.dischargeLat  ?? lat,
          dischargeLon:  trade?.dischargeLon  ?? lon,
          live:          true,
        };
      });
  }, []);

  // ── Map init + data ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [20, 20],
      zoom: 1.8,
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
      map.addLayer({ id: "routes", type: "line", source: "routes", paint: { "line-color": "#f5a524", "line-width": 0.8, "line-opacity": 0.28, "line-dasharray": [2, 3] } });
      map.addSource("routes-ex", { type: "geojson", data: { type: "FeatureCollection", features: routeFeatures(true) } });
      map.addLayer({ id: "routes-ex", type: "line", source: "routes-ex", paint: { "line-color": "#ef4444", "line-width": 1, "line-opacity": 0.5, "line-dasharray": [2, 2] } });

      // ── Vessel layers (GeoJSON-based, GPU-rendered — no DOM markers) ──────
      // Using native layers instead of maplibregl.Marker ensures correct
      // placement on the globe at all zoom levels with no drift.

      map.addImage("vessel-arrow", buildArrowImageData(), { sdf: true });
      map.addSource("vessels-src", {
        type: "geojson",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: toGeoJSON(list) as any,
      });

      // Soft glow behind each dot
      map.addLayer({
        id: "vessel-glow",
        type: "circle",
        source: "vessels-src",
        paint: {
          "circle-radius": 14,
          "circle-color": ["get", "color"],
          "circle-opacity": 0.12,
          "circle-blur": 0.8,
        },
      });

      // Primary dot at exact position
      map.addLayer({
        id: "vessel-dots",
        type: "circle",
        source: "vessels-src",
        paint: {
          "circle-radius": 5,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(0,0,0,0.6)",
        },
      });

      // Directional arrow above/beside the dot, rotated by heading
      map.addLayer({
        id: "vessel-arrows",
        type: "symbol",
        source: "vessels-src",
        layout: {
          "icon-image": "vessel-arrow",
          "icon-size": 0.85,
          "icon-rotate": ["get", "heading"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "icon-anchor": "bottom",
          "icon-offset": [0, -7],
        },
        paint: {
          "icon-color": ["get", "color"],
          "icon-opacity": 0.9,
        },
      });

      // Click: look up the vessel from the stable ref to avoid stale closure
      const onVesselClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        const v = vesselsRef.current.find((x) => x.id === id);
        if (v) setSelected(v);
      };
      map.on("click", "vessel-dots",   onVesselClick);
      map.on("click", "vessel-arrows", onVesselClick);
      map.on("mouseenter", "vessel-dots",   () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "vessel-dots",   () => { map.getCanvas().style.cursor = ""; });
      map.on("mouseenter", "vessel-arrows", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "vessel-arrows", () => { map.getCanvas().style.cursor = ""; });

      // Realtime subscription
      const channel = supabase
        .channel("live-vessels")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "vessels" }, (payload) => {
          const row = payload.new as Record<string, unknown>;
          const targetId = String(row.id ?? "");
          if (!targetId) return;

          const rawStatus = String(row.last_status ?? "").toLowerCase().replace(/ /g, "_");
          const isException = Number(row.ais_gaps_24h) > 0;

          setVessels((prev) =>
            prev.map((v) =>
              v.id === targetId
                ? {
                    ...v,
                    lat: row.last_position_lat != null ? Number(row.last_position_lat) : v.lat,
                    lon: row.last_position_lon != null ? Number(row.last_position_lon) : v.lon,
                    heading: Number(row.last_heading) || v.heading,
                    speed: String(row.last_speed ?? v.speed),
                    status: rawStatus || v.status,
                    exception: isException,
                    exceptionType: isException ? `AIS gap · ${row.ais_gaps_24h} gaps in 24h` : undefined,
                    live: true,
                  }
                : v
            )
          );
          setLastUpdated(new Date());
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "vessels" }, (payload) => {
          const deletedId = String((payload.old as Record<string, unknown>).id ?? "");
          if (!deletedId) return;
          setVessels((prev) => prev.filter((v) => v.id !== deletedId));
          setSelected((prev) => (prev?.id === deletedId ? null : prev));
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [mergeWithLive]);

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

      setVessels((prev) => {
        const exists = prev.find((v) => v.id === newVessel.id);
        return exists
          ? prev.map((v) => (v.id === newVessel.id ? newVessel : v))
          : [...prev, newVessel];
      });

      mapRef.current.flyTo({ center: [newVessel.lon, newVessel.lat], zoom: 5, duration: 1500 });
      setSelected(newVessel);
      setLastUpdated(new Date());
    };

    window.addEventListener("os:vessel-found", handler);
    return () => window.removeEventListener("os:vessel-found", handler);
  }, []); // intentionally empty — uses refs not state

  const exceptions = vessels.filter((v) => v.exception);
  const liveCount  = vessels.filter((v) => v.live).length;

  return (
    <>
      <style>{`
        .maplibregl-popup-content{background:#0c0c0c!important;border:1px solid #222!important;border-radius:0!important;padding:0!important;box-shadow:0 12px 40px rgba(0,0,0,.95)!important}
        .maplibregl-popup-tip{border-top-color:#0c0c0c!important;border-bottom-color:#0c0c0c!important}
        .maplibregl-ctrl-logo,.maplibregl-ctrl-attrib{display:none!important}
        .maplibregl-ctrl-group{background:rgba(12,12,12,.9)!important;border:1px solid rgba(40,40,40,.8)!important;border-radius:0!important}
        .maplibregl-ctrl-group button{background:transparent!important;filter:invert(.6)}
        .maplibregl-ctrl-group button:hover{background:rgba(245,165,36,.1)!important}
      `}</style>

      <div className="relative w-full overflow-hidden h-[calc(100dvh-56px)]">
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

        {/* Top vignette */}
        <div className="absolute top-0 inset-x-0 h-24 sm:h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />

        {/* Header */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-6 z-20">
          <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-amber mb-1">/ MAP — LIVE</div>
          <h1 className="font-display text-2xl sm:text-3xl tracking-tight drop-shadow-lg">World book</h1>
        </div>

        {/* Status strip — top right */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-20 flex items-center gap-2 sm:gap-3">
          {exceptions.length > 0 && (
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-crimson uppercase tracking-wider bg-black/70 px-2 sm:px-2.5 py-1 sm:py-1.5 border border-crimson/30 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" />
              <span className="hidden sm:inline">{exceptions.length} exception{exceptions.length !== 1 ? "s" : ""}</span>
              <span className="sm:hidden">{exceptions.length}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-mono text-[10px] bg-black/70 px-2 sm:px-2.5 py-1 sm:py-1.5 border border-ink-600/40 backdrop-blur-sm">
            <Radio className={cn("w-3 h-3", liveCount > 0 ? "text-emerald" : "text-ink-500")} />
            <span className={liveCount > 0 ? "text-emerald" : "text-ink-400"}>
              {liveCount > 0 ? `${liveCount} live` : "connecting"}
            </span>
            {lastUpdated && (
              <span className="hidden sm:inline text-ink-500 ml-1" suppressHydrationWarning>
                · {relativeTime(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        {/* Bottom vignette */}
        <div className="absolute bottom-0 inset-x-0 h-32 sm:h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10" />

        {/* KPI strip */}
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 z-20 grid grid-cols-3 gap-px bg-ink-600/30 border border-ink-600/30">
          {[
            { label: "At sea", longLabel: "Vessels at sea", value: String(vessels.filter((v) => v.status === "in_transit" || v.status === "under_way_using_engine").length), sub: "in transit", danger: false },
            { label: "Notional", longLabel: "Notional", value: "$1.2B", sub: "gross at sea", danger: false },
            { label: "Exceptions", longLabel: "Exceptions", value: String(exceptions.length), sub: "needs action", danger: exceptions.length > 0 },
          ].map((k) => (
            <div key={k.label} className="bg-black/75 backdrop-blur-sm px-3 py-2.5 sm:px-6 sm:py-4">
              <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-ink-400 mb-1 sm:mb-2">
                <span className="hidden sm:inline">{k.longLabel}</span>
                <span className="sm:hidden">{k.label}</span>
              </div>
              <div className={cn("font-display text-xl sm:text-3xl text-tabular", k.danger ? "text-crimson" : "text-amber")}>{k.value}</div>
              <div className="hidden sm:block font-mono text-[10px] text-ink-500 uppercase tracking-wider mt-1">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vessel detail — bottom sheet on mobile, right slide-over on desktop */}
      {selected && (
        <div className="fixed inset-0 z-50" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-label={`Vessel ${selected.name}`}
            className={cn(
              "absolute bg-ink border-ink-600/60 overflow-y-auto",
              // mobile: bottom sheet
              "inset-x-0 bottom-0 max-h-[85dvh] border-t rounded-t-lg",
              // desktop: right drawer
              "md:inset-x-auto md:bottom-auto md:right-0 md:top-0 md:h-full md:max-h-none md:w-[380px] md:border-t-0 md:border-l md:rounded-none"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-ink-500" />
            </div>

            <div className="px-5 sm:px-6 py-3 sm:py-4 border-b border-ink-600/60 flex items-center justify-between sticky top-0 bg-ink z-10">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-amber uppercase tracking-wider truncate">{selected.dealRef}</span>
                  {selected.live && (
                    <span className="flex items-center gap-1 font-mono text-[9px] text-emerald uppercase tracking-wider">
                      <span className="w-1 h-1 rounded-full bg-emerald animate-pulse" /> live
                    </span>
                  )}
                </div>
                <div className="font-mono text-sm text-white truncate">{selected.name}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close vessel details"
                className="text-ink-400 hover:text-white transition-colors p-2 -mr-2 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 pb-[calc(env(safe-area-inset-bottom,0)+1.5rem)]">
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

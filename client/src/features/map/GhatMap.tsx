import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  ExternalLink,
  Layers,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Scale,
  Eye,
  Satellite,
  Map as MapIcon,
  Mountain,
  Maximize2,
  Activity,
  Navigation,
  ChevronDown,
  Search,
  Radio,
  CheckCircle2,
  Droplets,
} from 'lucide-react';

import type { GhatPriority } from '../../types';
import {
  PriorityBadge,
  LegalStatusBadge,
  CoordinateStatusBadge,
} from '../../components/common/Badge';

interface GhatMapProps {
  ghats: GhatPriority[];
  selectedGhatName?: string;
  onSelectGhat: (siteName: string) => void;
  onOpenGhatDetail?: (ghat: GhatPriority) => void;
  onInspectEvidence?: (siteName: string) => void;
  language?: 'en' | 'hi';
}

export type MapLayerMode = 'environmental' | 'legal' | 'coordinate';
type BasemapMode = 'satellite' | 'street' | 'terrain';

// Tile layer configurations — reliable, free providers
const TILE_LAYERS: Record<
  BasemapMode,
  { url: string; attribution: string; maxZoom: number; label: string; subdomains?: string; desc: string }
> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 19,
    label: 'Satellite',
    desc: 'High-Res Aerial Imagery',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    label: 'Street',
    subdomains: 'abc',
    desc: 'OpenStreetMap Cartography',
  },
  terrain: {
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    label: 'Terrain',
    desc: 'Elevation Topo Contours',
  },
};

// For satellite view, optional road/place labels overlay
const LABELS_OVERLAY = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: '',
  maxZoom: 19,
};

function getPinColor(ghat: GhatPriority, mode: MapLayerMode): { bg: string; border: string; glow: string } {
  if (mode === 'environmental') {
    if (ghat.priority === 'high') return { bg: '#e11d48', border: '#fda4af', glow: 'rgba(225, 29, 72, 0.45)' };
    if (ghat.priority === 'medium') return { bg: '#d97706', border: '#fcd34d', glow: 'rgba(217, 119, 6, 0.45)' };
    return { bg: '#059669', border: '#6ee7b7', glow: 'rgba(5, 150, 105, 0.45)' };
  }
  if (mode === 'legal') {
    if (ghat.legalStatus === 'prohibited') return { bg: '#dc2626', border: '#fca5a5', glow: 'rgba(220, 38, 38, 0.45)' };
    if (ghat.legalStatus === 'conditional') return { bg: '#d97706', border: '#fcd34d', glow: 'rgba(217, 119, 6, 0.45)' };
    return { bg: '#059669', border: '#6ee7b7', glow: 'rgba(5, 150, 105, 0.45)' };
  }
  // coordinate
  if (ghat.coordinateStatus === 'verified') return { bg: '#0d9488', border: '#5eead4', glow: 'rgba(13, 148, 136, 0.45)' };
  return { bg: '#f59e0b', border: '#fde68a', glow: 'rgba(245, 158, 11, 0.45)' };
}

function createMarkerIcon(ghat: GhatPriority, mode: MapLayerMode, isActive: boolean): L.DivIcon {
  const { bg, border, glow } = getPinColor(ghat, mode);
  const size = isActive ? 44 : 34;

  return L.divIcon({
    className: 'custom-ghat-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${bg}, ${bg}ee);
        color: #ffffff;
        font-weight: 800;
        font-size: ${isActive ? 15 : 12}px;
        font-family: ui-monospace, 'Cascadia Code', monospace;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 14px ${glow}, 0 2px 6px rgba(0,0,0,0.4);
        border: ${isActive ? '3px solid #ffffff' : `2px solid ${border}`};
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <span style="transform: rotate(45deg); display: block; line-height: 1;">${ghat.rank}</span>
      </div>
      ${
        isActive
          ? `<div style="
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.9);
            color: #f8fafc;
            font-size: 11px;
            font-family: system-ui, -apple-system, sans-serif;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 6px;
            white-space: nowrap;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.15);
            backdrop-filter: blur(8px);
            letter-spacing: -0.01em;
          ">
            #${ghat.rank} ${ghat.site.length > 24 ? ghat.site.substring(0, 24) + '…' : ghat.site}
          </div>`
          : ''
      }
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 6)],
  });
}

export const GhatMap: React.FC<GhatMapProps> = ({
  ghats,
  selectedGhatName,
  onSelectGhat,
  onOpenGhatDetail,
  onInspectEvidence,
  language = 'en',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayerMode, setActiveLayerMode] = useState<MapLayerMode>('environmental');
  const [basemap, setBasemap] = useState<BasemapMode>('satellite');
  const [activeGhat, setActiveGhat] = useState<GhatPriority | null>(
    ghats.find((g) => g.site === selectedGhatName) || ghats[0] || null
  );
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [lakeFilter, setLakeFilter] = useState<'all' | 'upper' | 'lower' | 'shahpura'>('all');
  const [showLegend, setShowLegend] = useState(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [23.245, 77.41],
      zoom: 12,
      zoomControl: false,
      attributionControl: true,
    });

    // Custom zoom control position
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer — satellite
    const cfg = TILE_LAYERS['satellite'];
    const tileLayer = L.tileLayer(cfg.url, {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    }).addTo(map);

    // Labels overlay on satellite
    const labelsLayer = L.tileLayer(LABELS_OVERLAY.url, {
      maxZoom: LABELS_OVERLAY.maxZoom,
      opacity: 0.85,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    labelsLayerRef.current = labelsLayer;
    mapInstanceRef.current = map;

    // Critical fix: ResizeObserver ensures Leaflet never leaves unrendered dark voids
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    // Invalidation timers for initial layout transitions
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      labelsLayerRef.current = null;
    };
  }, []);

  // Switch basemap tile layer when basemap changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelsLayerRef.current) {
      map.removeLayer(labelsLayerRef.current);
      labelsLayerRef.current = null;
    }

    const cfg = TILE_LAYERS[basemap];
    const opts: L.TileLayerOptions = {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    };
    if (cfg.subdomains) opts.subdomains = cfg.subdomains;

    const newTile = L.tileLayer(cfg.url, opts).addTo(map);
    tileLayerRef.current = newTile;

    if (basemap === 'satellite') {
      const labelsLayer = L.tileLayer(LABELS_OVERLAY.url, {
        maxZoom: LABELS_OVERLAY.maxZoom,
        opacity: 0.85,
      }).addTo(map);
      labelsLayerRef.current = labelsLayer;
    }

    map.invalidateSize();
  }, [basemap]);

  // Update Markers when ghats, layer mode, or active ghat changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    ghats.forEach((ghat) => {
      const isActive = activeGhat?.site === ghat.site;
      const icon = createMarkerIcon(ghat, activeLayerMode, isActive);

      const marker = L.marker([ghat.latitude, ghat.longitude], {
        icon,
        title: ghat.site,
        zIndexOffset: isActive ? 1000 : 0,
      }).addTo(map);

      // Rich tooltip
      marker.bindTooltip(
        `<div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px 6px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; display: flex; align-items: center; gap: 6px;">
            <span style="background: #0f172a; color: white; border-radius: 4px; padding: 1px 5px; font-size: 10px;">#${ghat.rank}</span>
            <span>${ghat.site}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px; font-weight: 500;">${ghat.waterBody}</div>
          <div style="font-size: 10px; color: #0d9488; font-family: ui-monospace, monospace; font-weight: 600; margin-top: 2px;">
            ${ghat.latitude.toFixed(5)}°N, ${ghat.longitude.toFixed(5)}°E
          </div>
        </div>`,
        { direction: 'top', offset: [0, -32], className: 'ghat-tooltip' }
      );

      marker.on('click', () => {
        setActiveGhat(ghat);
        map.flyTo([ghat.latitude, ghat.longitude], 15.5, { duration: 1.0, easeLinearity: 0.25 });
      });

      markersRef.current[ghat.site] = marker;
    });
  }, [ghats, activeLayerMode, activeGhat]);

  // Fly to selected ghat on active change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeGhat) return;
    const current = map.getCenter();
    const dist = map.distance(current, L.latLng(activeGhat.latitude, activeGhat.longitude));
    if (dist > 300) {
      map.flyTo([activeGhat.latitude, activeGhat.longitude], 15.5, { duration: 1.0 });
    }
  }, [activeGhat]);

  // Sync if prop selectedGhatName changes from parent
  useEffect(() => {
    if (selectedGhatName) {
      const match = ghats.find((g) => g.site === selectedGhatName);
      if (match && match.site !== activeGhat?.site) {
        setActiveGhat(match);
      }
    }
  }, [selectedGhatName, ghats]);

  const handleSelectGhatFromList = (ghat: GhatPriority) => {
    setActiveGhat(ghat);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([ghat.latitude, ghat.longitude], 15.5, { duration: 1.0, easeLinearity: 0.25 });
    }
  };

  const handleResetBhopalView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([23.245, 77.41], 12, { duration: 1.2 });
    }
  };

  const handleCopyCoordinates = () => {
    if (!activeGhat) return;
    navigator.clipboard.writeText(`${activeGhat.latitude.toFixed(6)}, ${activeGhat.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  // Filtered ghats for bottom table
  const filteredGhats = useMemo(() => {
    return ghats.filter((g) => {
      const matchesSearch =
        searchFilter === '' ||
        g.site.toLowerCase().includes(searchFilter.toLowerCase()) ||
        g.waterBody.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesLake =
        lakeFilter === 'all' ||
        (lakeFilter === 'upper' && g.waterBody.toLowerCase().includes('upper')) ||
        (lakeFilter === 'lower' && g.waterBody.toLowerCase().includes('lower')) ||
        (lakeFilter === 'shahpura' && g.waterBody.toLowerCase().includes('shahpura'));

      return matchesSearch && matchesLake;
    });
  }, [ghats, searchFilter, lakeFilter]);

  const BasemapIcon = basemap === 'satellite' ? Satellite : basemap === 'street' ? MapIcon : Mountain;

  return (
    <div className="space-y-4">
      {/* Sleek Modern Controls Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Left: Data Layer Mode Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider pr-1">
            <Layers className="w-4 h-4 text-teal-600" />
            <span>Layer:</span>
          </div>

          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-1 text-xs">
            <button
              onClick={() => setActiveLayerMode('environmental')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeLayerMode === 'environmental'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-rose-500" />
              <span>Environmental Risk</span>
            </button>

            <button
              onClick={() => setActiveLayerMode('legal')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeLayerMode === 'legal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>NGT Compliance</span>
            </button>

            <button
              onClick={() => setActiveLayerMode('coordinate')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeLayerMode === 'coordinate'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-teal-600" />
              <span>GPS Precision</span>
            </button>
          </div>
        </div>

        {/* Right: Basemap Selector + Quick Ghat Fly + Reset */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between xl:justify-end">
          {/* Basemap switcher */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 gap-0.5 text-xs">
            {(['satellite', 'street', 'terrain'] as BasemapMode[]).map((bm) => {
              const Icon = bm === 'satellite' ? Satellite : bm === 'street' ? MapIcon : Mountain;
              const isActive = basemap === bm;
              return (
                <button
                  key={bm}
                  onClick={() => setBasemap(bm)}
                  title={TILE_LAYERS[bm].desc}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all capitalize ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{TILE_LAYERS[bm].label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Ghat Dropdown */}
          <div className="relative">
            <select
              value={activeGhat?.site || ''}
              onChange={(e) => {
                const g = ghats.find((item) => item.site === e.target.value);
                if (g) handleSelectGhatFromList(g);
              }}
              className="text-xs font-semibold bg-white border border-slate-200/90 rounded-xl pl-3 pr-8 py-2 text-slate-800 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 appearance-none cursor-pointer"
            >
              {ghats.map((g) => (
                <option key={g.site} value={g.site}>
                  #{g.rank} {g.site} ({g.waterBody.replace(' Lake', '')})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset View Button */}
          <button
            onClick={handleResetBhopalView}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 shadow-2xs transition-colors"
            title="Reset camera to full Bhopal basin"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Recenter</span>
          </button>
        </div>
      </div>

      {/* Main Map + Inspector Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column: Leaflet Map Container */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden relative flex flex-col min-h-[580px] lg:min-h-[640px] bg-slate-950">
          {/* Top-Left GIS HUD Pill */}
          <div className="absolute top-3.5 left-3.5 z-[1000] flex items-center gap-2 pointer-events-none">
            <div className="bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <BasemapIcon className="w-3.5 h-3.5 text-teal-300" />
              <span>{TILE_LAYERS[basemap].desc}</span>
            </div>
          </div>

          {/* Map DOM Element */}
          <div
            ref={mapContainerRef}
            className="w-full h-full flex-1 min-h-[580px] lg:min-h-[640px]"
          />

          {/* Bottom-Left Floating GIS HUD Legend */}
          <div className="absolute bottom-4 left-4 z-[1000]">
            {showLegend ? (
              <div className="bg-slate-950/85 backdrop-blur-md text-white p-3.5 rounded-2xl border border-white/10 shadow-xl text-xs space-y-2 max-w-[270px]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
                  <div className="font-bold text-[10px] uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-teal-400" />
                    {activeLayerMode === 'environmental' && 'Environmental Risk Signal'}
                    {activeLayerMode === 'legal' && 'NGT Compliance Status'}
                    {activeLayerMode === 'coordinate' && 'GPS Precision Benchmark'}
                  </div>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="text-slate-400 hover:text-white text-[10px] font-mono px-1"
                    title="Minimize legend"
                  >
                    ×
                  </button>
                </div>

                {activeLayerMode === 'environmental' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50 flex-shrink-0" />
                      <span className="text-slate-200">High Risk (DO Collapse &gt;40%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs shadow-amber-500/50 flex-shrink-0" />
                      <span className="text-slate-200">Medium (Elevated BOD / Excursion)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50 flex-shrink-0" />
                      <span className="text-slate-200">Lower Priority (DO ≥ 5.0 mg/l)</span>
                    </div>
                  </div>
                )}

                {activeLayerMode === 'legal' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
                      <span className="text-slate-200">Prohibited in Natural Lake</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <span className="text-slate-200">Conditional in Kund</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-slate-200">Authorised Kund Facility</span>
                    </div>
                  </div>
                )}

                {activeLayerMode === 'coordinate' && (
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-400 flex-shrink-0" />
                      <span className="text-slate-200">GPS Verified (On-ground match)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0" />
                      <span className="text-slate-200">Approximate (Field check needed)</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowLegend(true)}
                className="bg-slate-950/85 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-white/10 shadow-lg flex items-center gap-1.5 hover:bg-slate-900 transition-colors"
              >
                <Radio className="w-3 h-3 text-teal-400" />
                <span>Show Legend</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Inspector Panel (Executive Geospatial Brief) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
          {activeGhat ? (
            <div className="space-y-4 flex-1">
              {/* Header Box */}
              <div className="border-b border-slate-100 pb-3.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-white">
                      RANK #{activeGhat.rank} OF 7
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {activeGhat.waterBody}
                    </span>
                  </div>

                  <span className="text-[11px] text-teal-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    Active Site
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
                  {activeGhat.site}
                </h2>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <PriorityBadge priority={activeGhat.priority} />
                  <LegalStatusBadge status={activeGhat.legalStatus} />
                  <CoordinateStatusBadge status={activeGhat.coordinateStatus} />
                </div>
              </div>

              {/* Monospace GPS Coordinates Card */}
              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5 text-teal-400">
                    <Compass className="w-3.5 h-3.5" />
                    Verified GPS Coordinates
                  </span>
                  <button
                    onClick={handleCopyCoordinates}
                    className="text-xs text-teal-300 hover:text-white flex items-center gap-1 font-semibold transition-colors bg-white/10 px-2 py-0.5 rounded-md"
                    title="Copy latitude and longitude"
                  >
                    {copiedCoords ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs font-bold text-white">
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-normal">LATITUDE</span>
                    <span className="text-teal-300 text-sm">{activeGhat.latitude.toFixed(6)}° N</span>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-normal">LONGITUDE</span>
                    <span className="text-teal-300 text-sm">{activeGhat.longitude.toFixed(6)}° E</span>
                  </div>
                </div>

                {activeGhat.locationDescription && (
                  <p className="text-[11px] text-slate-300 leading-relaxed pt-1.5 border-t border-slate-800">
                    {activeGhat.locationDescription}
                  </p>
                )}
              </div>

              {/* NGT Legal Directive Callout */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Scale className="w-3.5 h-3.5 text-amber-700" />
                  <span>NGT Directive Mandate</span>
                </div>
                <p className="text-amber-950/90 text-[11px] leading-relaxed">
                  {activeGhat.legalStatus === 'prohibited'
                    ? 'Direct idol immersion into this natural lake is strictly banned by NGT orders. BMC must enforce complete redirection to offline artificial kunds.'
                    : activeGhat.legalStatus === 'authorised'
                    ? 'Approved artificial kund facility, engineered exclusively for idol containment outside natural water bodies.'
                    : 'Immersion permitted only inside designated artificial kund tank; direct natural lake entry strictly prohibited.'}
                </p>
              </div>

              {/* Physical Containment Infrastructure Callout */}
              <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-200/80 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-teal-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                  <span>Visarjan Infrastructure</span>
                </div>
                <p className="text-teal-950/90 text-[11px] leading-relaxed">
                  {activeGhat.site.toLowerCase().includes('bairagarh')
                    ? 'Dedicated artificial kund with concrete containment walls and heavy sediment catchment trap.'
                    : activeGhat.site.toLowerCase().includes('prempura')
                    ? 'High-capacity staging area equipped with hydraulic cranes, barricades, and collection pontoons.'
                    : 'Masonry ghat facility with temporary barricading and municipal collection crews.'}
                </p>
              </div>

              {/* Visual Water Quality Risk Signals */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/90 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    Water Quality Signals
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Class B Thresholds</span>
                </div>

                {/* DO Deficit Gauge */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Dissolved Oxygen Deficit (&lt;5 mg/L):</span>
                    <span className={`font-mono font-bold ${activeGhat.doExceedanceRate > 30 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {activeGhat.doExceedanceRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeGhat.doExceedanceRate > 30 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, activeGhat.doExceedanceRate))}%` }}
                    />
                  </div>
                </div>

                {/* BOD Exceedance Gauge */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-600 font-medium">Organic BOD Exceedance (&gt;3 mg/L):</span>
                    <span className={`font-mono font-bold ${activeGhat.bodExceedanceRate > 40 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {activeGhat.bodExceedanceRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeGhat.bodExceedanceRate > 40 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, activeGhat.bodExceedanceRate))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center gap-2">
              <MapPin className="w-8 h-8 text-slate-300" />
              <span>Select any pin on the map to inspect location telemetry.</span>
            </div>
          )}

          {/* Action Buttons Hub */}
          {activeGhat && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              {/* Primary Action: Full Dossier */}
              {onOpenGhatDetail && (
                <button
                  onClick={() => onOpenGhatDetail(activeGhat)}
                  className="w-full text-center text-xs font-bold text-white bg-gradient-to-r from-teal-700 to-teal-800 hover:from-teal-800 hover:to-teal-900 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-teal-700/20 active:scale-[0.99]"
                >
                  <Maximize2 className="w-4 h-4 text-teal-200" />
                  <span>Full Ghat Dossier &amp; Detailed Specs</span>
                </button>
              )}

              {/* Secondary Actions Row */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={activeGhat.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Google Earth</span>
                </a>

                <button
                  onClick={() => onSelectGhat(activeGhat.site)}
                  className="text-center text-xs font-bold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-teal-700" />
                  <span>Water Quality</span>
                </button>
              </div>

              {onInspectEvidence && (
                <button
                  onClick={() => onInspectEvidence(activeGhat.site)}
                  className="w-full text-center text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100/70 border border-teal-200/80 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Search className="w-3.5 h-3.5 text-teal-600" />
                  <span>Inspect Measurement Evidence Log</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Coordinate Register Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>All 7 Immersion Locations — Coordinate Register</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified GPS telemetry and NGT compliance status. Click any row to fly to site.
            </p>
          </div>

          {/* Quick Lake filter pills and Search */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={language === 'hi' ? 'घाट खोजें...' : 'Filter sites...'}
                className="text-xs bg-slate-50 border border-slate-200/90 rounded-xl pl-7 pr-3 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-44 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'all', label: 'All (7)' },
                  { id: 'upper', label: 'Upper' },
                  { id: 'lower', label: 'Lower' },
                  { id: 'shahpura', label: 'Shahpura' },
                ] as const
              ).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setLakeFilter(filter.id)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                    lakeFilter === filter.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>


        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Immersion Site</th>
                <th className="py-3 px-4">Water Body</th>
                <th className="py-3 px-4 font-mono">GPS Coordinates</th>
                <th className="py-3 px-4 text-center">GPS Precision</th>
                <th className="py-3 px-4 text-center">NGT Compliance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredGhats.map((g) => {
                const isSelected = activeGhat?.site === g.site;
                return (
                  <tr
                    key={g.site}
                    onClick={() => handleSelectGhatFromList(g)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-50/70 font-medium'
                        : 'hover:bg-slate-50/80 text-slate-700'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono ${
                          isSelected
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {g.rank}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{g.site}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">{g.waterBody}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 text-[11px] tabular-nums">
                      {g.latitude.toFixed(5)}° N, {g.longitude.toFixed(5)}° E
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <CoordinateStatusBadge status={g.coordinateStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <LegalStatusBadge status={g.legalStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectGhatFromList(g);
                        }}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 mr-2 px-2.5 py-1 rounded-lg hover:bg-teal-100/60 transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Fly to</span>
                      </button>
                      <a
                        href={g.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 inline-flex items-center transition-colors"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Embedded CSS enhancements for Leaflet UI */}
      <style>{`
        .ghat-tooltip {
          background: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
          padding: 8px 12px !important;
          color: #0f172a !important;
        }
        .ghat-tooltip::before {
          display: none !important;
        }
        .leaflet-tooltip-top.ghat-tooltip::before {
          display: block !important;
          border-top-color: #ffffff !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2) !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          margin-top: 14px !important;
          margin-right: 14px !important;
        }
        .leaflet-control-zoom a {
          background-color: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(8px) !important;
          color: #1e293b !important;
          width: 34px !important;
          height: 34px !important;
          line-height: 34px !important;
          font-size: 15px !important;
          border-bottom: 1px solid #e2e8f0 !important;
          transition: all 0.2s ease !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #ffffff !important;
          color: #0d9488 !important;
        }
        .leaflet-control-attribution {
          background: rgba(15, 23, 42, 0.75) !important;
          backdrop-filter: blur(6px) !important;
          color: #94a3b8 !important;
          font-size: 10px !important;
          border-top-left-radius: 8px !important;
          padding: 2px 8px !important;
        }
        .leaflet-control-attribution a {
          color: #38bdf8 !important;
          text-decoration: none !important;
        }
      `}</style>
    </div>
  );
};


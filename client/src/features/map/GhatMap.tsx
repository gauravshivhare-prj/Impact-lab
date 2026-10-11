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
  Maximize2,
  ChevronDown,
  Search,
  Crosshair,
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

function getPinColor(ghat: GhatPriority, mode: MapLayerMode): { bg: string; dot: string } {
  if (mode === 'environmental') {
    if (ghat.priority === 'high') return { bg: '#e11d48', dot: '#f43f5e' };
    if (ghat.priority === 'medium') return { bg: '#d97706', dot: '#f59e0b' };
    return { bg: '#059669', dot: '#10b981' };
  }
  if (mode === 'legal') {
    if (ghat.legalStatus === 'prohibited') return { bg: '#dc2626', dot: '#ef4444' };
    if (ghat.legalStatus === 'conditional') return { bg: '#d97706', dot: '#f59e0b' };
    return { bg: '#059669', dot: '#10b981' };
  }
  // coordinate
  if (ghat.coordinateStatus === 'verified') return { bg: '#0d9488', dot: '#14b8a6' };
  return { bg: '#f59e0b', dot: '#fbbf24' };
}

function createMarkerIcon(ghat: GhatPriority, mode: MapLayerMode, isActive: boolean): L.DivIcon {
  const { dot } = getPinColor(ghat, mode);

  if (isActive) {
    return L.divIcon({
      className: 'custom-ghat-marker active-marker',
      html: `
        <div style="display: flex; align-items: center; position: relative; cursor: pointer;">
          <div style="
            width: 28px;
            height: 28px;
            background: #f43f5e;
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 0 5px rgba(244, 63, 94, 0.4), 0 4px 12px rgba(0,0,0,0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 800;
            font-size: 12px;
            flex-shrink: 0;
            transition: transform 0.2s ease;
          ">
            ${ghat.rank}
          </div>
          <div style="
            margin-left: 8px;
            background: #ffffff;
            color: #0f172a;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 8px;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            border: 1px solid rgba(0,0,0,0.08);
            letter-spacing: -0.01em;
          ">
            ${ghat.site}
          </div>
        </div>
      `,
      iconSize: [220, 32],
      iconAnchor: [14, 16],
      popupAnchor: [0, -20],
    });
  }

  // Inactive marker: colored dot with label matching screenshot
  const shortName = ghat.site.replace(' kund', '').replace(' (Sant Hirdaram)', '');

  return L.divIcon({
    className: 'custom-ghat-marker inactive-marker',
    html: `
      <div style="display: flex; align-items: center; position: relative; cursor: pointer; opacity: 0.95;">
        <div style="
          width: 18px;
          height: 18px;
          background: ${dot};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          flex-shrink: 0;
        "></div>
        <div style="
          margin-left: 6px;
          background: rgba(15, 23, 42, 0.82);
          color: #ffffff;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 5px;
          white-space: nowrap;
          backdrop-filter: blur(4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
        ">
          ${shortName}
        </div>
      </div>
    `,
    iconSize: [160, 24],
    iconAnchor: [9, 12],
    popupAnchor: [0, -16],
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [23.245, 77.41],
      zoom: 12.5,
      zoomControl: false,
      attributionControl: true,
    });

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

    // ResizeObserver ensures Leaflet never leaves unrendered gaps
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

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
      map.flyTo([23.245, 77.41], 12.5, { duration: 1.2 });
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

  return (
    <div className="space-y-4">
      {/* Controls Toolbar matching exact layout of screenshot */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
        {/* Section 1: Data Layer */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Data Layer</span>
          </div>
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 gap-1 text-xs">
            {(['environmental', 'legal', 'coordinate'] as MapLayerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveLayerMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeLayerMode === mode
                    ? 'bg-white text-teal-800 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode === 'environmental' ? 'Environmental' : mode === 'legal' ? 'NGT Legal' : 'GPS Precision'}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Map View */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Compass className="w-3.5 h-3.5 text-teal-600" />
            <span>Map View</span>
          </div>
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 gap-1 text-xs">
            {(['satellite', 'street', 'terrain'] as BasemapMode[]).map((bm) => (
              <button
                key={bm}
                onClick={() => setBasemap(bm)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all capitalize ${
                  basemap === bm
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {TILE_LAYERS[bm].label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3 & 4: Select Ghat / Site + Reset Button */}
        <div className="space-y-1 flex-1 max-w-md">
          <div className="text-xs font-bold text-slate-700">
            Select Ghat / Site
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <select
                value={activeGhat?.site || ''}
                onChange={(e) => {
                  const g = ghats.find((item) => item.site === e.target.value);
                  if (g) handleSelectGhatFromList(g);
                }}
                className="w-full text-xs font-semibold bg-white border border-slate-200/90 rounded-xl pl-8 pr-8 py-2 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
              >
                {ghats.map((g) => (
                  <option key={g.site} value={g.site}>
                    #{g.rank} {g.site}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={handleResetBhopalView}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2 shadow-2xs transition-colors whitespace-nowrap"
              title="Reset camera to Bhopal basin"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map + Inspector Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Leaflet Map Container */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden relative flex flex-col min-h-[580px] lg:min-h-[640px] bg-slate-950 isolate">
          {/* Top-Right Map Controls: Zoom in, Zoom out, Recenter Target */}
          <div className="absolute top-4 right-4 z-20 flex flex-col bg-white rounded-xl shadow-md border border-slate-200/90 overflow-hidden">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-base border-b border-slate-200/80 cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors font-bold text-base border-b border-slate-200/80 cursor-pointer"
              title="Zoom Out"
            >
              −
            </button>
            <button
              onClick={() => {
                if (activeGhat && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([activeGhat.latitude, activeGhat.longitude], 15.5, { duration: 1 });
                }
              }}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Center on active ghat"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Map DOM Element */}
          <div
            ref={mapContainerRef}
            className="w-full h-full flex-1 min-h-[580px] lg:min-h-[640px]"
          />

          {/* Bottom-Left Floating Legend matching mockup */}
          <div className="absolute bottom-4 left-4 z-20 bg-black/75 backdrop-blur-md rounded-xl p-3 text-white border border-white/10 shadow-lg text-xs space-y-2 max-w-[200px]">
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50 flex-shrink-0" />
                <span className="text-slate-200 font-medium">High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50 flex-shrink-0" />
                <span className="text-slate-200 font-medium">Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50 flex-shrink-0" />
                <span className="text-slate-200 font-medium">Low Priority</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Inspector Panel matching screenshot exactly */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 flex flex-col justify-between space-y-4">
          {activeGhat ? (
            <div className="space-y-4 flex-1">
              {/* Header Box */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wide border border-rose-100/80">
                    RANK #{activeGhat.rank}
                  </span>
                  <span className="text-slate-400 font-bold tracking-wider uppercase text-[11px]">
                    {activeGhat.waterBody}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-tight">
                  {activeGhat.site}
                </h2>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <PriorityBadge priority={activeGhat.priority} />
                  <LegalStatusBadge status={activeGhat.legalStatus} />
                  <CoordinateStatusBadge status={activeGhat.coordinateStatus} />
                </div>
              </div>

              {/* GPS Coordinates Box */}
              <div className="p-3.5 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5 text-teal-700">
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    GPS Coordinates
                  </span>
                  <button
                    onClick={handleCopyCoordinates}
                    className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  >
                    {copiedCoords ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-teal-600" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="font-mono text-sm font-bold text-slate-800 pt-0.5">
                  <div>{activeGhat.latitude.toFixed(6)}° N</div>
                  <div>{activeGhat.longitude.toFixed(6)}° E</div>
                </div>

                {activeGhat.locationDescription && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-slate-200/70">
                    {activeGhat.locationDescription}
                  </p>
                )}
              </div>

              {/* NGT Directive */}
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <Scale className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900 block font-bold">NGT Directive:</strong>
                  <span className="text-slate-600 leading-relaxed block mt-0.5">
                    {activeGhat.legalStatus === 'prohibited'
                      ? 'Direct immersion into this natural lake is strictly banned by NGT orders. BMC must enforce complete redirection to offline artificial kunds.'
                      : activeGhat.legalStatus === 'authorised'
                      ? 'Approved artificial kund facility, engineered exclusively for idol containment outside natural water bodies.'
                      : 'Immersion permitted only inside designated artificial kund tank; direct lake entry prohibited.'}
                  </span>
                </div>
              </div>

              {/* Infrastructure */}
              <div className="flex items-start gap-2.5 text-xs text-slate-700 pt-2 border-t border-slate-100">
                <ShieldCheck className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-slate-900 block font-bold">Infrastructure:</strong>
                  <span className="text-slate-600 leading-relaxed block mt-0.5">
                    {activeGhat.site.toLowerCase().includes('bairagarh')
                      ? 'Dedicated artificial kund with concrete walls and sediment catchment trap.'
                      : activeGhat.site.toLowerCase().includes('prempura')
                      ? 'High-capacity staging area with hydraulic cranes and collection pontoons.'
                      : 'Masonry ghat with temporary barricades and mobile disposal teams.'}
                  </span>
                </div>
              </div>

              {/* Historical Quality Signals */}
              <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Historical Quality Signals
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>DO deficit (&lt;5 mg/l):</span>
                  <span className={activeGhat.doExceedanceRate > 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                    {activeGhat.doExceedanceRate}%
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 font-mono">
                  <span>BOD excess (&gt;3 mg/l):</span>
                  <span className={activeGhat.bodExceedanceRate > 40 ? 'text-rose-600 font-bold' : 'text-amber-600 font-bold'}>
                    {activeGhat.bodExceedanceRate}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center gap-2">
              <MapPin className="w-8 h-8 text-slate-300" />
              <span>Select any pin on the map to inspect location details.</span>
            </div>
          )}

          {/* Action Buttons */}
          {activeGhat && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {onOpenGhatDetail && (
                <button
                  onClick={() => onOpenGhatDetail(activeGhat)}
                  className="w-full text-center text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Full Ghat Dossier &amp; Specifications</span>
                </button>
              )}

              <a
                href={activeGhat.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                <span>Open in Google Maps Satellite</span>
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectGhat(activeGhat.site)}
                  className="flex-1 text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Water Quality</span>
                </button>

                {onInspectEvidence && (
                  <button
                    onClick={() => onInspectEvidence(activeGhat.site)}
                    className="flex-1 text-center text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>View Evidence</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate Register Table Card */}
      <div id="coordinate-register-table" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-6">
        {/* Table Header with Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <span>All 7 Immersion Locations — Coordinate Register</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Approximate locations from online mapping sources. Click any row to fly to site.
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
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
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



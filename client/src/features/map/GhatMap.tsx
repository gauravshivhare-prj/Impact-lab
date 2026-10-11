import React, { useEffect, useRef, useState } from 'react';
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
  Map,
  Mountain,
  Maximize2,
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

// High-quality tile layer configurations — all free, no API key required
const TILE_LAYERS: Record<
  BasemapMode,
  { url: string; attribution: string; maxZoom: number; label: string; subdomains?: string }
> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    label: 'Satellite',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    label: 'Street',
    subdomains: 'abc',
  },
  terrain: {
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
    label: 'Terrain',
  },
};

// For satellite view, add a labels overlay on top for readability
const LABELS_OVERLAY = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  attribution: '',
  maxZoom: 19,
};

function getPinColor(ghat: GhatPriority, mode: MapLayerMode): string {
  if (mode === 'environmental') {
    if (ghat.priority === 'high') return '#e11d48';
    if (ghat.priority === 'medium') return '#d97706';
    return '#059669';
  }
  if (mode === 'legal') {
    if (ghat.legalStatus === 'prohibited') return '#dc2626';
    if (ghat.legalStatus === 'conditional') return '#d97706';
    return '#059669';
  }
  // coordinate
  if (ghat.coordinateStatus === 'verified') return '#0d9488';
  return '#f59e0b';
}

function createMarkerIcon(ghat: GhatPriority, mode: MapLayerMode, isActive: boolean): L.DivIcon {
  const color = getPinColor(ghat, mode);
  const size = isActive ? 42 : 34;
  const border = isActive ? '3px solid #ffffff' : '2px solid rgba(255,255,255,0.9)';
  const shadow = isActive
    ? '0 4px 20px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.3)'
    : '0 3px 12px rgba(0,0,0,0.3)';

  return L.divIcon({
    className: '',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, ${color}, ${color}cc);
        color: #ffffff;
        font-weight: 700;
        font-size: ${isActive ? 15 : 12}px;
        font-family: ui-monospace, 'Cascadia Code', monospace;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: ${shadow};
        border: ${border};
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(4px);
      ">
        <span style="transform: rotate(45deg); display: block; line-height: 1;">${ghat.rank}</span>
      </div>
      ${isActive ? `<div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.75);
        color: white;
        font-size: 10px;
        font-family: system-ui, sans-serif;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        backdrop-filter: blur(4px);
      ">${ghat.site.length > 22 ? ghat.site.substring(0, 22) + '…' : ghat.site}</div>` : ''}
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

    return () => {
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

    // Remove existing tile layer
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

    // Add labels overlay on satellite only
    if (basemap === 'satellite') {
      const labelsLayer = L.tileLayer(LABELS_OVERLAY.url, {
        maxZoom: LABELS_OVERLAY.maxZoom,
        opacity: 0.85,
      }).addTo(map);
      labelsLayerRef.current = labelsLayer;
    }
  }, [basemap]);

  // Update Markers when ghats, layer mode, or active ghat changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
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
        `<div style="font-family: system-ui, sans-serif; padding: 2px 4px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">#${ghat.rank} ${ghat.site}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${ghat.waterBody}</div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 1px;">${ghat.latitude.toFixed(5)}°N, ${ghat.longitude.toFixed(5)}°E</div>
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
    // Only fly if not already near
    const current = map.getCenter();
    const dist = map.distance(current, L.latLng(activeGhat.latitude, activeGhat.longitude));
    if (dist > 500) {
      map.flyTo([activeGhat.latitude, activeGhat.longitude], 15, { duration: 1.0 });
    }
  }, [activeGhat]);

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

  const BasemapIcon = basemap === 'satellite' ? Satellite : basemap === 'street' ? Map : Mountain;

  return (
    <div className="space-y-4">
      {/* Controls Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Data Layer Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Data Layer:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
            {(['environmental', 'legal', 'coordinate'] as MapLayerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveLayerMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeLayerMode === mode
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode === 'environmental' ? 'Environmental' : mode === 'legal' ? 'NGT Legal' : 'GPS Precision'}
              </button>
            ))}
          </div>
        </div>

        {/* Right controls: Basemap + Fly to + Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Basemap switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1.5 flex items-center gap-1">
              <BasemapIcon className="w-3 h-3" />
            </span>
            {(['satellite', 'street', 'terrain'] as BasemapMode[]).map((bm) => (
              <button
                key={bm}
                onClick={() => setBasemap(bm)}
                title={`Switch to ${TILE_LAYERS[bm].label} map`}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-all capitalize ${
                  basemap === bm
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {TILE_LAYERS[bm].label}
              </button>
            ))}
          </div>

          {/* Fly-to Ghat */}
          <select
            value={activeGhat?.site || ''}
            onChange={(e) => {
              const g = ghats.find((item) => item.site === e.target.value);
              if (g) handleSelectGhatFromList(g);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            {ghats.map((g) => (
              <option key={g.site} value={g.site}>
                #{g.rank} {g.site}
              </option>
            ))}
          </select>

          {/* Reset View */}
          <button
            onClick={handleResetBhopalView}
            className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors"
            title="Reset to full Bhopal view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Map + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Map Container */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden relative bg-slate-900">
          {/* Satellite badge */}
          {basemap === 'satellite' && (
            <div className="absolute top-3 left-3 z-[1000] bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1.5 pointer-events-none">
              <Satellite className="w-3 h-3 text-sky-400" />
              High-Res Satellite Imagery
            </div>
          )}

          <div
            ref={mapContainerRef}
            className="w-full h-[540px]"
            style={{ background: '#1a2435' }}
          />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-200/80 shadow-lg text-xs space-y-1.5 max-w-[250px]">
            <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider">
              {activeLayerMode === 'environmental' && 'Priority Legend'}
              {activeLayerMode === 'legal' && 'NGT Legal Status'}
              {activeLayerMode === 'coordinate' && 'GPS Precision'}
            </div>

            {activeLayerMode === 'environmental' && (
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0" />
                  <span>High Priority (DO Collapse &gt;40%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>Medium (Elevated BOD / Excursion)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
                  <span>Lower Priority (DO ≥ 5.0 mg/l)</span>
                </div>
              </div>
            )}

            {activeLayerMode === 'legal' && (
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600 flex-shrink-0" />
                  <span>Prohibited (NGT Ban)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>Conditional (Kund only)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
                  <span>Authorised Artificial Kund</span>
                </div>
              </div>
            )}

            {activeLayerMode === 'coordinate' && (
              <div className="space-y-1 text-slate-600 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 flex-shrink-0" />
                  <span>GPS Verified (On-ground match)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>Approximate (Field check needed)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between space-y-4">
          {activeGhat ? (
            <div className="space-y-4 flex-1">
              {/* Header */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                  <span>Rank #{activeGhat.rank}</span>
                  <span>·</span>
                  <span>{activeGhat.waterBody}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                  {activeGhat.site}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <PriorityBadge priority={activeGhat.priority} />
                  <LegalStatusBadge status={activeGhat.legalStatus} />
                  <CoordinateStatusBadge status={activeGhat.coordinateStatus} />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-teal-600" />
                    GPS Coordinates
                  </span>
                  <button
                    onClick={handleCopyCoordinates}
                    className="text-teal-700 hover:text-teal-900 flex items-center gap-1 font-medium text-[11px] transition-colors"
                  >
                    {copiedCoords ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-slate-800 tabular-nums">
                  {activeGhat.latitude.toFixed(6)}° N
                </div>
                <div className="font-mono text-sm font-bold text-slate-800 tabular-nums">
                  {activeGhat.longitude.toFixed(6)}° E
                </div>
                {activeGhat.locationDescription && (
                  <p className="text-xs text-slate-500 leading-relaxed pt-1 border-t border-slate-200">
                    {activeGhat.locationDescription}
                  </p>
                )}
              </div>

              {/* NGT & Infrastructure */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2">
                  <Scale className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-800 block">NGT Directive:</strong>
                    <span className="text-slate-600 leading-relaxed block mt-0.5">
                      {activeGhat.legalStatus === 'prohibited'
                        ? 'Direct immersion into this natural lake is strictly banned by NGT orders. BMC must enforce redirection to offline kund tanks.'
                        : activeGhat.legalStatus === 'authorised'
                        ? 'Approved artificial kund facility, engineered exclusively for idol disposal outside natural water bodies.'
                        : 'Immersion permitted only inside designated artificial kund tank; direct lake entry prohibited.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-800 block">Infrastructure:</strong>
                    <span className="text-slate-600 leading-relaxed block mt-0.5">
                      {activeGhat.site.toLowerCase().includes('bairagarh')
                        ? 'Dedicated artificial kund with concrete walls and sediment catchment trap.'
                        : activeGhat.site.toLowerCase().includes('prempura')
                        ? 'High-capacity staging area with hydraulic cranes and collection pontoons.'
                        : 'Masonry ghat with temporary barricades and mobile disposal teams.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Water Quality Stats */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
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
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 text-xs text-center gap-2">
              <MapPin className="w-8 h-8 text-slate-300" />
              <span>Click a marker on the map to inspect location details.</span>
            </div>
          )}

          {/* Action Buttons */}
          {activeGhat && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {onOpenGhatDetail && (
                <button
                  onClick={() => onOpenGhatDetail(activeGhat)}
                  className="w-full text-center text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Full Ghat Dossier &amp; Specifications</span>
                </button>
              )}

              <a
                href={activeGhat.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                Open in Google Maps Satellite
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => onSelectGhat(activeGhat.site)}
                  className="flex-1 text-center text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Water Quality
                </button>

                {onInspectEvidence && (
                  <button
                    onClick={() => onInspectEvidence(activeGhat.site)}
                    className="flex-1 text-center text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    View Evidence
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coordinate Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              All 7 Immersion Locations — Coordinate Register
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified GPS coordinates, NGT compliance status. Click "Fly to" to navigate the satellite map.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4">Water Body</th>
                <th className="py-3 px-4 font-mono">Latitude, Longitude</th>
                <th className="py-3 px-4 text-center">GPS</th>
                <th className="py-3 px-4 text-center">NGT Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ghats.map((g) => (
                <tr
                  key={g.site}
                  onClick={() => handleSelectGhatFromList(g)}
                  className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                    activeGhat?.site === g.site ? 'bg-teal-50/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{g.rank}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{g.site}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">{g.waterBody}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-600 text-[11px] tabular-nums">
                    {g.latitude.toFixed(5)}° N, {g.longitude.toFixed(5)}° E
                  </td>
                  <td className="py-3 px-4 text-center">
                    <CoordinateStatusBadge status={g.coordinateStatus} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <LegalStatusBadge status={g.legalStatus} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectGhatFromList(g);
                      }}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1 mr-2"
                    >
                      <MapPin className="w-3 h-3" />
                      Fly to
                    </button>
                    <a
                      href={g.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-slate-400 hover:text-slate-700 inline-flex items-center"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tooltip styling */}
      <style>{`
        .ghat-tooltip {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          padding: 8px 10px;
          font-size: 12px;
          color: #0f172a;
        }
        .ghat-tooltip::before {
          display: none;
        }
        .leaflet-tooltip-top.ghat-tooltip::before {
          display: block;
          border-top-color: #e2e8f0;
        }
      `}</style>
    </div>
  );
};

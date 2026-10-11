import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Compass,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Scale,
  Satellite,
  Map as MapIcon,
  Mountain,
  AlertTriangle,
  Info,
  BarChart2,
  FileText,
} from 'lucide-react';
import type { GhatPriority } from '../../types';
import {
  PriorityBadge,
  LegalStatusBadge,
  CoordinateStatusBadge,
  ConfidenceBadge,
} from '../common/Badge';
import { GHAT_GEOSPATIAL_DATA } from '../../data/ghatGeospatialData';

interface GhatDetailModalProps {
  ghat: GhatPriority | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToMap: (siteName: string) => void;
  onNavigateToQuality: (siteName: string) => void;
  onNavigateToEvidence: (siteName: string) => void;
  language: 'en' | 'hi';
}

type BasemapType = 'satellite' | 'street' | 'terrain';

const TILE_CONFIGS: Record<
  BasemapType,
  { url: string; attribution: string; maxZoom: number; label: string; subdomains?: string }
> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
    label: 'Satellite',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
    label: 'Street',
    subdomains: 'abc',
  },
  terrain: {
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap',
    maxZoom: 17,
    label: 'Terrain',
  },
};

const LABELS_OVERLAY_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

export const GhatDetailModal: React.FC<GhatDetailModalProps> = ({
  ghat,
  isOpen,
  onClose,
  onNavigateToMap,
  onNavigateToQuality,
  onNavigateToEvidence,
  language,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [basemap, setBasemap] = useState<BasemapType>('satellite');
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Leaflet map initialization & updates
  useEffect(() => {
    if (!isOpen || !ghat || !mapContainerRef.current) return;

    // Small delay to allow DOM to layout modal
    const initTimer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [ghat.latitude, ghat.longitude],
          zoom: 15.5,
          zoomControl: false,
          attributionControl: true,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        const cfg = TILE_CONFIGS[basemap];
        const tileLayer = L.tileLayer(cfg.url, {
          maxZoom: cfg.maxZoom,
          attribution: cfg.attribution,
        }).addTo(map);

        tileLayerRef.current = tileLayer;

        if (basemap === 'satellite') {
          const labelsLayer = L.tileLayer(LABELS_OVERLAY_URL, {
            maxZoom: 19,
            opacity: 0.85,
          }).addTo(map);
          labelsLayerRef.current = labelsLayer;
        }

        mapInstanceRef.current = map;
      } else {
        mapInstanceRef.current.setView([ghat.latitude, ghat.longitude], 15.5);
      }

      // Add or update marker
      if (mapInstanceRef.current) {
        if (markerRef.current) {
          markerRef.current.remove();
        }

        const pinColor =
          ghat.priority === 'high'
            ? '#e11d48'
            : ghat.priority === 'medium'
            ? '#d97706'
            : '#059669';

        const customIcon = L.divIcon({
          className: '',
          html: `
            <div style="
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              width: 44px;
              height: 44px;
              background: linear-gradient(135deg, ${pinColor}, ${pinColor}dd);
              color: #ffffff;
              font-weight: 800;
              font-size: 14px;
              font-family: ui-monospace, monospace;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 4px rgba(255,255,255,0.4);
              border: 3px solid #ffffff;
              cursor: pointer;
            ">
              <span style="transform: rotate(45deg); display: block; line-height: 1;">#${ghat.rank}</span>
            </div>
            <div style="
              position: absolute;
              bottom: -8px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(15,23,42,0.92);
              color: white;
              font-size: 11px;
              font-family: system-ui, sans-serif;
              font-weight: 700;
              padding: 3px 8px;
              border-radius: 6px;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ">${ghat.site}</div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
          popupAnchor: [0, -50],
        });

        const marker = L.marker([ghat.latitude, ghat.longitude], {
          icon: customIcon,
        }).addTo(mapInstanceRef.current);

        markerRef.current = marker;

        mapInstanceRef.current.invalidateSize();
      }
    }, 120);

    return () => {
      clearTimeout(initTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        labelsLayerRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, ghat]);

  // Handle Basemap Switch
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

    const cfg = TILE_CONFIGS[basemap];
    const opts: L.TileLayerOptions = {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution,
    };
    if (cfg.subdomains) opts.subdomains = cfg.subdomains;

    const newTile = L.tileLayer(cfg.url, opts).addTo(map);
    tileLayerRef.current = newTile;

    if (basemap === 'satellite') {
      const labelsLayer = L.tileLayer(LABELS_OVERLAY_URL, {
        maxZoom: 19,
        opacity: 0.85,
      }).addTo(map);
      labelsLayerRef.current = labelsLayer;
    }
  }, [basemap]);

  if (!isOpen || !ghat) return null;

  const geoExtra = GHAT_GEOSPATIAL_DATA[ghat.site];
  const doStat = ghat.parameterStats['Dissolved oxygen'];
  const bodStat = ghat.parameterStats['BOD'];
  const phStat = ghat.parameterStats['pH'];

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${ghat.latitude.toFixed(6)}, ${ghat.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([ghat.latitude, ghat.longitude], 15.5, { duration: 0.8 });
    }
  };

  const BasemapIcon =
    basemap === 'satellite' ? Satellite : basemap === 'street' ? MapIcon : Mountain;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in isolate"
      role="dialog"
      aria-modal="true"
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Main Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden z-10 isolate">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-slate-50/90 border-b border-slate-200/80 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white">
                #{ghat.rank} {language === 'hi' ? 'प्राथमिकता क्रम' : 'Visarjan Site'}
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                {ghat.waterBody}
              </span>
              <PriorityBadge priority={ghat.priority} />
              <LegalStatusBadge status={ghat.legalStatus} />
              <CoordinateStatusBadge status={ghat.coordinateStatus} />
              <ConfidenceBadge confidence={ghat.confidence} />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1.5 leading-snug tracking-tight">
              {ghat.site}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 transition-colors flex-shrink-0"
            aria-label="Close details modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Interactive Map & Geospatial Intel (5 cols on lg) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Map Container Card */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-slate-900 relative">
                {/* Map Controls Floating Header */}
                <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between pointer-events-none">
                  {/* Basemap switcher */}
                  <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1 pointer-events-auto text-xs">
                    <span className="p-1 text-slate-400">
                      <BasemapIcon className="w-3.5 h-3.5" />
                    </span>
                    {(['satellite', 'street', 'terrain'] as BasemapType[]).map((bm) => (
                      <button
                        key={bm}
                        onClick={() => setBasemap(bm)}
                        className={`px-2.5 py-1 rounded-lg font-medium text-[11px] capitalize transition-all ${
                          basemap === bm
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {TILE_CONFIGS[bm].label}
                      </button>
                    ))}
                  </div>

                  {/* Recenter button */}
                  <button
                    onClick={handleRecenter}
                    title="Recenter on ghat"
                    className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-md border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-white transition-all pointer-events-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Leaflet Map Div */}
                <div
                  ref={mapContainerRef}
                  className="w-full h-[320px] sm:h-[340px]"
                  style={{ background: '#131b26' }}
                />

                {/* Bottom Overlay Badge */}
                <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono px-3 py-1 rounded-lg flex items-center gap-1.5 pointer-events-none shadow-sm">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  <span>
                    {ghat.latitude.toFixed(5)}°N, {ghat.longitude.toFixed(5)}°E
                  </span>
                </div>
              </div>

              {/* GPS Coordinates & Google Maps Box */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Compass className="w-4 h-4 text-teal-600" />
                    {language === 'hi' ? 'सत्यापित जीपीएस निर्देशांक' : 'Verified GPS Coordinates'}
                  </span>
                  <button
                    onClick={handleCopyCoords}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 bg-white border border-teal-200 px-2.5 py-1 rounded-lg shadow-2xs transition-colors"
                  >
                    {copiedCoords ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
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

                <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200/70">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans block">Latitude</span>
                    {ghat.latitude.toFixed(6)}° N
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans block">Longitude</span>
                    {ghat.longitude.toFixed(6)}° E
                  </div>
                </div>

                {ghat.locationDescription && (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {ghat.locationDescription}
                  </p>
                )}

                <div className="pt-1 flex gap-2">
                  <a
                    href={ghat.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100/80 border border-slate-200 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    {language === 'hi' ? 'गूगल मैप्स सैटेलाइट में खोलें' : 'Open in Google Maps Satellite'}
                  </a>
                </div>
              </div>

              {/* NGT Legal & Containment Directives */}
              <div className="bg-amber-50/60 rounded-2xl border border-amber-200/70 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[11px]">
                  <Scale className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>
                    {language === 'hi' ? 'एनजीटी विनियामक निर्देश' : 'NGT Regulatory Mandate'}
                  </span>
                </div>
                <p className="text-amber-950/80 leading-relaxed">
                  {geoExtra?.ngtDirectiveNote ||
                    (ghat.legalStatus === 'prohibited'
                      ? 'Direct immersion into natural lake waters is strictly banned by NGT directives. Municipal authorities must enforce redirection to offline artificial kund tanks.'
                      : ghat.legalStatus === 'authorised'
                      ? 'Approved artificial kund facility engineered specifically for idol immersion outside natural water bodies.'
                      : 'Immersion permitted strictly inside designated artificial kund tank; direct natural lake entry prohibited.')}
                </p>
              </div>

              {/* Immersion Infrastructure */}
              <div className="bg-teal-50/60 rounded-2xl border border-teal-200/70 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <span>
                    {language === 'hi' ? 'विसर्जन अधोसंरचना' : 'Immersion Infrastructure & Containment'}
                  </span>
                </div>
                <p className="text-teal-950/80 leading-relaxed">
                  {geoExtra?.immersionInfrastructure ||
                    'Dedicated immersion facilities with containment barriers and silt capture.'}
                </p>
              </div>
            </div>

            {/* Right Column: In-Depth Water Quality & Historical Signals (6 cols on lg) */}
            <div className="lg:col-span-6 space-y-5">
              {/* Primary Key Finding Callout */}
              <div className="bg-gradient-to-r from-rose-50/80 to-amber-50/80 border border-rose-200/80 rounded-2xl p-4.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>
                    {language === 'hi' ? 'प्रमुख ऐतिहासिक निष्कर्ष' : 'Key Environmental Finding'}
                  </span>
                </div>
                <p className="text-slate-900 font-semibold text-sm leading-relaxed">
                  {ghat.primaryReason}
                </p>
                {ghat.secondaryReasons.length > 0 && (
                  <ul className="text-xs text-slate-600 list-disc list-inside space-y-1 pt-1 border-t border-rose-100">
                    {ghat.secondaryReasons.map((reason, idx) => (
                      <li key={idx} className="leading-snug">
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Water Quality Stats Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>
                      {language === 'hi' ? 'जल गुणवत्ता पैरामीटर ऑडिट' : 'Water Quality Benchmark Signals'}
                    </span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    CPCB Class B Standard
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Dissolved Oxygen Card */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Dissolved Oxygen</span>
                      <span className="text-[10px] font-mono text-slate-400">&ge; 5.0 mg/l</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div
                        className={`text-2xl font-black font-mono ${
                          ghat.doExceedanceRate > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {ghat.doExceedanceRate}%
                      </div>
                      <div className="text-xs font-semibold text-slate-500 font-mono">
                        {doStat ? `${doStat.exceedanceCount} / ${doStat.validCount}` : '—'} Deficit
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          ghat.doExceedanceRate > 50
                            ? 'bg-rose-600'
                            : ghat.doExceedanceRate > 0
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, ghat.doExceedanceRate)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                      <span>Min: {doStat?.min ?? '—'} mg/l</span>
                      <span>Avg: {doStat?.avg ?? '—'} mg/l</span>
                    </div>

                    {ghat.zeroDOCount > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>{ghat.zeroDOCount} Zero-DO (Complete Anoxia) readings!</span>
                      </div>
                    )}
                  </div>

                  {/* BOD Card */}
                  <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">BOD (Organic Load)</span>
                      <span className="text-[10px] font-mono text-slate-400">&le; 3.0 mg/l</span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div
                        className={`text-2xl font-black font-mono ${
                          ghat.bodExceedanceRate > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {ghat.bodExceedanceRate}%
                      </div>
                      <div className="text-xs font-semibold text-slate-500 font-mono">
                        {bodStat ? `${bodStat.exceedanceCount} / ${bodStat.validCount}` : '—'} Exceeded
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          ghat.bodExceedanceRate > 50
                            ? 'bg-rose-600'
                            : ghat.bodExceedanceRate > 0
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, ghat.bodExceedanceRate)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                      <span>Max: {bodStat?.max ?? '—'} mg/l</span>
                      <span>Avg: {bodStat?.avg ?? '—'} mg/l</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 flex justify-between">
                      <span>pH (6.5–8.5):</span>
                      <span className="font-mono font-semibold text-slate-700">
                        {phStat && phStat.exceedanceCount > 0
                          ? `${phStat.exceedanceCount} Excursions`
                          : '100% Compliant'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Coverage & Caveats */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Sampling Record & Coverage Scope</span>
                </h4>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Total Records</span>
                    <span className="font-mono font-bold text-sm text-slate-800">{ghat.totalRecords}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Valid Quantified</span>
                    <span className="font-mono font-bold text-sm text-emerald-700">{ghat.validNumericCount}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Years Covered</span>
                    <span className="font-mono font-bold text-sm text-slate-800">{ghat.yearsCovered.join(', ')}</span>
                  </div>
                </div>

                {ghat.durga2025Missing && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Durga 2025 Report Gap:</strong> This site was omitted from the printed Durga 2025 table in official MPPCB reports. Absence of records does not indicate clean water.
                    </div>
                  </div>
                )}
              </div>

              {/* Score breakdown info */}
              <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Deterministic Risk Score:</span>
                  <span className="text-slate-500 text-[11px]">
                    Calculated from DO collapse (40%), BOD exceedance (30%), zero-DO penalty.
                  </span>
                </div>
                <div className="font-mono font-bold text-base text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  {ghat.scoringBreakdown.totalScore} pts
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-slate-400 hidden sm:flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-teal-600" />
            <span>Click any deep-dive action below to navigate corresponding tools</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Open Full Bhopal Map */}
            <button
              onClick={() => {
                onClose();
                onNavigateToMap(ghat.site);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 py-2.5 px-4 rounded-xl shadow-sm transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'पूर्ण मानचित्र में देखें' : 'View on Full Map'}</span>
            </button>

            {/* Water Quality Analysis */}
            <button
              onClick={() => {
                onClose();
                onNavigateToQuality(ghat.site);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-slate-800 hover:text-slate-900 bg-white hover:bg-slate-100/90 border border-slate-200/90 py-2.5 px-4 rounded-xl shadow-2xs transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5 text-slate-600" />
              <span>{language === 'hi' ? 'जल गुणवत्ता विश्लेषण' : 'Water Quality Trends'}</span>
            </button>

            {/* View Evidence Records */}
            <button
              onClick={() => {
                onClose();
                onNavigateToEvidence(ghat.site);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100/90 border border-slate-200/90 py-2.5 px-3.5 rounded-xl shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'hi' ? 'साक्ष्य' : 'Evidence'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-slate-800 bg-transparent py-2.5 px-3 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

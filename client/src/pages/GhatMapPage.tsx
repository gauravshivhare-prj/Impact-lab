import React from 'react';
import { dataService } from '../services/dataService';
import { GhatMap } from '../features/map/GhatMap';
import { MapPin, Scale, Compass, CheckCircle2 } from 'lucide-react';

import type { GhatPriority } from '../types';

interface GhatMapPageProps {
  selectedSite: string;
  onSelectGhat: (siteName: string) => void;
  onOpenGhatDetail?: (ghat: GhatPriority) => void;
  onInspectEvidence?: (siteName: string) => void;
  language: 'en' | 'hi';
}

export const GhatMapPage: React.FC<GhatMapPageProps> = ({
  selectedSite,
  onSelectGhat,
  onOpenGhatDetail,
  onInspectEvidence,
  language,
}) => {
  const allGhats = dataService.getSiteRankings();

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Sleek Modern Geospatial Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700/60 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-10 w-32 h-32 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Compass className="w-3 h-3" />
                GIS Geospatial Intelligence
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-slate-300 border border-white/10">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                7 Monitored Immersion Sites
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-400" />
              {language === 'hi'
                ? 'भोपाल विसर्जन घाट भू-स्थानिक मानचित्र'
                : 'Bhopal Immersion Ghat Geospatial Intelligence'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {language === 'hi'
                ? 'सभी सात घाटों के वास्तविक जीपीएस निर्देशांक, एनजीटी विनियामक स्थिति एवं विसर्जन अधोसंरचना का इंटरेक्टिव उपग्रह मानचित्र।'
                : 'Interactive high-resolution satellite imagery mapping verified GPS coordinates, NGT legal containment directives, and physical containment infrastructure across Bhopal water bodies.'}
            </p>
          </div>

          {/* NGT Directive Compliance Notice Pill */}
          <div className="flex-shrink-0 bg-amber-500/15 border border-amber-400/30 rounded-xl p-3 max-w-sm text-xs backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
              <Scale className="w-3.5 h-3.5" />
              <span>NGT Lake Protection Mandate</span>
            </div>
            <p className="text-amber-100/90 text-[11px] leading-snug">
              Direct idol immersion into Upper &amp; Lower Lakes is strictly prohibited. Immersion must occur in dedicated off-lake artificial kunds.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Feature */}
      <GhatMap
        ghats={allGhats}
        selectedGhatName={selectedSite}
        onSelectGhat={onSelectGhat}
        onOpenGhatDetail={onOpenGhatDetail}
        onInspectEvidence={onInspectEvidence}
        language={language}
      />
    </div>
  );
};


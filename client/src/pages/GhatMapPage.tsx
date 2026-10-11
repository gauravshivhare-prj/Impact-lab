import React from 'react';
import { dataService } from '../services/dataService';
import { GhatMap } from '../features/map/GhatMap';
import { MapPin, Scale } from 'lucide-react';

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
      {/* Intro Context Banner */}
      <div className="bg-[#f0f7f6] border border-[#d2ebe6] rounded-xl p-3.5 px-4 flex items-start space-x-3 text-xs sm:text-sm text-slate-600 shadow-2xs">
        <div className="p-0.5 text-teal-600 flex-shrink-0 mt-0.5">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">
            {language === 'hi'
              ? 'भोपाल विसर्जन घाट भू-स्थानिक मानचित्र:'
              : 'Bhopal Immersion Ghat Geospatial Map:'}
          </span>{' '}
          {language === 'hi'
            ? 'सभी सात घाटों के वास्तविक जीपीएस निर्देशांक, एनजीटी विनियामक स्थिति एवं विसर्जन अधोसंरचना का इंटरेक्टिव मानचित्र।'
            : 'Interactive geospatial map displaying verified GPS coordinates, NGT regulatory containment status, and idol immersion infrastructure for all seven monitoring sites.'}
          <div className="text-slate-500 text-xs mt-0.5 flex items-center space-x-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-600 inline" />
            <span>
              National Green Tribunal directives prohibit direct immersion into natural Upper &amp; Lower Lakes. Immersion must occur in dedicated artificial kunds.
            </span>
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

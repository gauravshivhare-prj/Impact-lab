import React from 'react';
import { dataService } from '../services/dataService';
import { GhatMap } from '../features/map/GhatMap';
import { MapPin, Waves, ArrowRight } from 'lucide-react';

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
    <div className="w-full pb-12 font-sans">
      {/* Full-width Panoramic Scenic Lake Hero Banner matching screenshot */}
      <div className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-200/80">
        {/* Background Image of Bhopal Lake */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/bhopal_lake_hero.jpg')`,
            backgroundPosition: 'center 38%',
          }}
        />
        {/* Dark subtle gradient overlay to ensure high contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />

        {/* Content container */}
        <div className="relative z-10 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Column: Heading and description */}
          <div className="max-w-xl space-y-2.5">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-md border border-white/25 shadow-xs">
              VISARJAN GHAT WATCH
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-sm">
              Interactive Ghat Map
            </h1>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
              Explore verified immersion sites across Bhopal with geospatial data, regulatory status, and environmental context.
            </p>
          </div>

          {/* Right Column: Floating Stat Pill Card matching screenshot */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:px-5 sm:py-3.5 shadow-xl border border-white/90 flex items-center gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
            {/* Stat 1: Monitored Ghats */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-none">7</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Monitored Ghats</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200/80" />

            {/* Stat 2: Upper Lake */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                <Waves className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-none">2</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Upper Lake</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200/80" />

            {/* Stat 3: Lower Lake */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 flex-shrink-0">
                <Waves className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xl font-extrabold text-slate-900 leading-none">5</div>
                <div className="text-[11px] font-semibold text-slate-500 mt-0.5">Lower Lake</div>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-200/80" />

            {/* Action: View All Ghats */}
            <button
              onClick={() => {
                const el = document.getElementById('coordinate-register-table');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 ml-auto sm:ml-0 whitespace-nowrap group transition-colors"
            >
              <span>View All Ghats</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Map Content Container */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6 space-y-5">
        <GhatMap
          ghats={allGhats}
          selectedGhatName={selectedSite}
          onSelectGhat={onSelectGhat}
          onOpenGhatDetail={onOpenGhatDetail}
          onInspectEvidence={onInspectEvidence}
          language={language}
        />
      </div>
    </div>
  );
};



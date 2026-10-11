import React from 'react';
import {
  MapPin,
  FileText,
  BarChart2,
  AlertTriangle,
  ArrowRight,
  Map as MapIcon,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { GhatPriority, Measurement, PriorityLevel } from '../types';

// Helper to get priority display colors
const getPriorityColors = (priority: PriorityLevel) => {
  switch (priority) {
    case 'high':
      return { border: 'border-rose-500', bg: 'bg-rose-500', hover: 'group-hover:border-rose-300', badge: 'bg-rose-50 text-rose-600 border-rose-200/80' };
    case 'medium':
      return { border: 'border-amber-500', bg: 'bg-amber-500', hover: 'group-hover:border-amber-300', badge: 'bg-amber-50 text-amber-600 border-amber-200/80' };
    case 'lower':
      return { border: 'border-emerald-500', bg: 'bg-emerald-500', hover: 'group-hover:border-emerald-300', badge: 'bg-emerald-50 text-emerald-600 border-emerald-200/80' };
    default:
      return { border: 'border-slate-400', bg: 'bg-slate-400', hover: 'group-hover:border-slate-300', badge: 'bg-slate-50 text-slate-600 border-slate-200/80' };
  }
};

const getPriorityLabel = (priority: PriorityLevel) => {
  switch (priority) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'lower': return 'Lower';
    default: return 'Insufficient Data';
  }
};

interface OverviewPageProps {
  onSelectGhat: (siteName: string) => void;
  onOpenGhatDetail?: (ghat: GhatPriority) => void;
  onNavigateToTab: (tab: any) => void;
  onInspectEvidence: (measurement: Measurement) => void;
  language: 'en' | 'hi';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectGhat,
  onOpenGhatDetail,
  onNavigateToTab,
  language,
}) => {
  const metrics = dataService.getOverviewMetrics();
  const rankings = dataService.getSiteRankings();

  const handleOpenGhat = (ghat: GhatPriority) => {
    if (onOpenGhatDetail) {
      onOpenGhatDetail(ghat);
    } else {
      onSelectGhat(ghat.site);
    }
  };

  // Find ranking objects for all 7 monitored ghats
  const bairagarhGhat =
    rankings.find((r) => r.site.toLowerCase().includes('bairagarh')) || rankings[0];
  const malikhediGhat =
    rankings.find((r) => r.site.toLowerCase().includes('malikhedi')) || rankings[1];
  const kamlaParkGhat =
    rankings.find((r) => r.site.toLowerCase().includes('kamla')) || rankings[2];
  const prempuraGhat =
    rankings.find((r) => r.site.toLowerCase().includes('prempura')) || rankings[3];
  const khatlapuraGhat =
    rankings.find((r) => r.site.toLowerCase().includes('khatlapura')) || rankings[4];
  const shahpuraGhat =
    rankings.find((r) => r.site.toLowerCase().includes('shahpura')) || rankings[5];
  const hathaikhedaGhat =
    rankings.find((r) => r.site.toLowerCase().includes('hathaikheda')) || rankings[6];
  const kaliasotGhat =
    rankings.find((r) => r.site.toLowerCase().includes('hathaikheda') || r.site.toLowerCase().includes('prempura')) ||
    rankings[6] ||
    rankings[2];

  return (
    <div className="relative min-h-[calc(100vh-62px)] overflow-hidden pb-12 font-sans">
      <div className="relative z-10 max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-6">
        {/* Hero Text Section */}
        <div className="max-w-2xl space-y-3">
          {/* Pill Badge */}
          <div className="inline-block">
            <span className="text-[11px] font-bold tracking-wider text-slate-700 bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-full px-3.5 py-1 shadow-2xs uppercase">
              {language === 'hi' ? 'विसर्जन घाट वॉच' : 'VISARJAN GHAT WATCH'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.14]">
            {language === 'hi' ? (
              <>
                भोपाल के घाटों में
                <br />
                जल गुणवत्ता
              </>
            ) : (
              <>
                Water Quality in
                <br />
                Bhopal’s Ghats
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed max-w-lg pt-0.5">
            {language === 'hi' ? (
              <>
                विसर्जन योजना के सहयोग हेतु ऐतिहासिक साक्ष्य।
                <br />
                मध्य प्रदेश प्रदूषण नियंत्रण बोर्ड (MPCB) की 2023–2025 रिपोर्टों पर आधारित।
              </>
            ) : (
              <>
                Historical evidence to support immersion planning.
                <br />
                Based on 2023–2025 data from MPCB reports.
              </>
            )}
          </p>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Card 1: Monitored Ghats */}
          <div className="bg-white/95 backdrop-blur-md p-4.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center space-x-3.5 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
              <MapPin className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {language === 'hi' ? 'निगरानी किए गए घाट' : 'MONITORED GHATS'}
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-900 leading-tight mt-0.5">
                {metrics.totalGhats}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                {language === 'hi'
                  ? 'भोपाल के शहरी जल स्रोत'
                  : 'Urban water bodies across Bhopal'}
              </p>
            </div>
          </div>

          {/* Card 2: Total Records */}
          <div className="bg-white/95 backdrop-blur-md p-4.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center space-x-3.5 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 flex-shrink-0">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {language === 'hi' ? 'कुल रिकॉर्ड्स' : 'TOTAL RECORDS'}
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-900 leading-tight mt-0.5">
                {metrics.totalRecords.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                {language === 'hi'
                  ? 'MPCB रिपोर्टों के 3 वर्षों में 14 कॉलम'
                  : '14 columns across 3 years of MPCB reports'}
              </p>
            </div>
          </div>

          {/* Card 3: Valid Measurements */}
          <div className="bg-white/95 backdrop-blur-md p-4.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center space-x-3.5 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {language === 'hi' ? 'वैध माप' : 'VALID MEASUREMENTS'}
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-900 leading-tight mt-0.5">
                {metrics.validNumericMeasurements.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                {language === 'hi'
                  ? 'रासायनिक एवं भौतिक परीक्षण'
                  : 'Chemical & physical readings'}
              </p>
            </div>
          </div>

          {/* Card 4: Data Caveats */}
          <div className="bg-white/95 backdrop-blur-md p-4.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center space-x-3.5 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                {language === 'hi' ? 'डेटा चेतावनियां' : 'DATA CAVEATS'}
              </div>
              <div className="text-2xl sm:text-[28px] font-black text-slate-900 leading-tight mt-0.5">
                {metrics.nonNumericOrFlagged}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                174 BDL, 57 not sampled, 4 zero DO
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Two Sections: Ghat Priority Map + Top Priority Ghats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Left Feature Card: Ghat Priority Map */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-5 flex flex-col space-y-3.5 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg text-slate-700 bg-slate-100 mt-0.5">
                  <MapIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {language === 'hi' ? 'घाट प्राथमिकता मानचित्र' : 'Ghat Priority Map'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'hi'
                      ? 'निगरानी किए गए घाट एवं उनके प्राथमिकता स्तर देखें'
                      : 'View monitored ghats and their priority levels'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('map')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50/70 border border-teal-600/30 rounded-lg px-3 py-1.5 shadow-2xs transition-colors flex-shrink-0"
              >
                <span>{language === 'hi' ? 'पूर्ण मानचित्र खोलें' : 'Open Full Map'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stylized Bhopal Lake Cartographic SVG Map Preview */}
            <div className="relative w-full flex-1 min-h-[360px] sm:min-h-[420px] rounded-xl overflow-hidden bg-[#eef5f3] border border-slate-200/90 shadow-inner select-none flex items-center justify-center p-1 sm:p-2">
              <div className="relative w-full h-full max-w-[700px] max-h-[380px] aspect-[700/380]">
                <svg
                  viewBox="0 0 700 380"
                  className="w-full h-full"
                  preserveAspectRatio="none"
                >
                  {/* Background Roads / Contours */}
                  <path
                    d="M0 120 Q180 140 320 180 T700 240 M100 0 Q140 180 200 380 M480 0 Q460 200 520 380 M0 280 Q300 260 700 120 M260 0 C280 120 340 240 380 380"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    fill="none"
                    opacity="0.8"
                  />
                  <path
                    d="M50 80 Q200 90 400 140 T700 180 M350 40 Q400 180 440 340"
                    stroke="#ffffff"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.6"
                  />

                  {/* Upper Lake (Bada Talab) - Organic Water Body */}
                  <path
                    d="M40 160 C80 140 150 130 220 150 C290 170 330 140 380 170 C410 190 440 220 420 270 C400 310 320 320 240 330 C160 340 90 300 60 260 C30 220 20 180 40 160 Z"
                    fill="#a2d5ed"
                    stroke="#8ac5e2"
                    strokeWidth="1.5"
                  />
                  {/* Upper Lake western extension */}
                  <path
                    d="M0 200 C30 180 60 170 90 200 C110 220 80 250 50 260 C20 270 0 240 0 200 Z"
                    fill="#a2d5ed"
                  />

                  {/* Lower Lake (Chhota Talab) */}
                  <path
                    d="M390 290 C410 260 450 250 480 280 C500 300 480 340 440 350 C410 360 380 320 390 290 Z"
                    fill="#a2d5ed"
                    stroke="#8ac5e2"
                    strokeWidth="1.5"
                  />

                  {/* Shahpura Lake (south) */}
                  <path
                    d="M470 370 C490 355 520 360 530 380 L460 380 Z"
                    fill="#a2d5ed"
                    opacity="0.9"
                  />

                  {/* Lake Names Labels (positioned clearly away from all ghats) */}
                  <text
                    x="210"
                    y="235"
                    fill="#2c7799"
                    fontSize="13"
                    fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.5"
                  >
                    Upper Lake
                  </text>
                  <text
                    x="425"
                    y="315"
                    fill="#2c7799"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="system-ui, sans-serif"
                    letterSpacing="0.3"
                  >
                    Lower Lake
                  </text>

                  {/* Subtle Dots for Other Ghats */}
                  <circle cx="165" cy="240" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="360" cy="245" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="435" cy="275" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="475" cy="350" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="560" cy="180" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="95" cy="325" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="380" cy="360" r="4.5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                </svg>

                {/* Pin 1: Bairagarh kund (Upper Lake NW - High Priority) */}
                <div
                  onClick={() => handleOpenGhat(bairagarhGhat)}
                  className="absolute top-[18%] left-[23%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Bairagarh (Sant Hirdaram) kund - High Priority (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-rose-300">
                    Bairagarh kund
                  </div>
                </div>

                {/* Pin 2: Malikhedi kund (North bypass - High Priority) */}
                <div
                  onClick={() => handleOpenGhat(malikhediGhat)}
                  className="absolute top-[17%] left-[55%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Malikhedi kund - High Priority (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-rose-300">
                    Malikhedi kund
                  </div>
                </div>

                {/* Pin 3: Rani Kamlapati / Kamla Park (Between Lakes - High Priority) */}
                <div
                  onClick={() => handleOpenGhat(kamlaParkGhat)}
                  className="absolute top-[46%] left-[54%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Rani Kamlapati / Kamla Park kund - High Priority (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-rose-300">
                    Kamla Park
                  </div>
                </div>

                {/* Pin 4: Prempura ghat (Upper Lake SW - Heavy Immersion / Prohibited) */}
                <div
                  onClick={() => handleOpenGhat(prempuraGhat)}
                  className="absolute top-[72%] left-[24%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Prempura ghat - Major Staging Hub (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-amber-300">
                    Prempura
                  </div>
                </div>

                {/* Pin 5: Khatlapura ghat (Lower Lake - Historic Crowd / Prohibited) */}
                <div
                  onClick={() => handleOpenGhat(khatlapuraGhat)}
                  className="absolute top-[54%] left-[67%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Khatlapura ghat - Historic Visarjan Ghat (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-amber-300">
                    Khatlapura
                  </div>
                </div>

                {/* Pin 6: Shahpura lake ghat (South Bhopal - Medium Priority) */}
                <div
                  onClick={() => handleOpenGhat(shahpuraGhat)}
                  className="absolute top-[82%] left-[65%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Shahpura lake ghat (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-amber-300">
                    Shahpura
                  </div>
                </div>

                {/* Pin 7: Hathaikheda dam / kund (East Peripheral - Low Priority) */}
                <div
                  onClick={() => handleOpenGhat(hathaikhedaGhat)}
                  className="absolute top-[24%] left-[84%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105"
                  title="Hathaikheda dam / kund (Click to view details)"
                >
                  <div className="w-5 h-5 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="bg-white/95 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-emerald-300">
                    Hathaikheda
                  </div>
                </div>

                {/* Bottom Left Floating Map Legend (Clear of all pins) */}
                <div className="absolute bottom-2.5 left-2.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-md text-[10px] space-y-1 z-20 font-medium text-slate-700 pointer-events-none">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200 flex-shrink-0" />
                    <span>{language === 'hi' ? 'उच्च जोखिम' : 'High Hazard'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-200 flex-shrink-0" />
                    <span>{language === 'hi' ? 'मध्यम / एनजीटी' : 'Medium / NGT Watch'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200 flex-shrink-0" />
                    <span>{language === 'hi' ? 'क्लास बी अनुपालन' : 'Class B Compliant'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Feature Card: Top Priority Ghats Table */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-5 flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg text-slate-700 bg-slate-100 mt-0.5">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {language === 'hi' ? 'शीर्ष प्राथमिकता घाट' : 'Top Priority Ghats'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'hi'
                      ? 'जल गुणवत्ता चिंताओं के आधार पर क्रमबद्ध (2023–2025)'
                      : 'Ranked by water quality concerns (2023–2025)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('priorities')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50/70 border border-teal-600/30 rounded-lg px-3 py-1.5 shadow-2xs transition-colors flex-shrink-0"
              >
                <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">GHAT / SITE</th>
                    <th className="py-2.5 px-3 text-center">PRIORITY</th>
                    <th className="py-2.5 px-3">KEY FINDING</th>
                    <th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Bairagarh (Sant Hirdaram) kund - Dynamic priority */}
                  <tr
                    onClick={() => handleOpenGhat(bairagarhGhat)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {bairagarhGhat.rank}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                        {bairagarhGhat.site}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {bairagarhGhat.waterBody}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColors(bairagarhGhat.priority).badge}`}>
                        {getPriorityLabel(bairagarhGhat.priority)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-xs leading-relaxed max-w-[200px]">
                      {bairagarhGhat.primaryReason.length > 50
                        ? bairagarhGhat.primaryReason.substring(0, 50) + '...'
                        : bairagarhGhat.primaryReason}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGhat(bairagarhGhat);
                        }}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs mx-auto"
                        title="View details and map"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 2: Malikhedi kund - Dynamic priority */}
                  <tr
                    onClick={() => handleOpenGhat(malikhediGhat)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {malikhediGhat.rank}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                        {malikhediGhat.site}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {malikhediGhat.waterBody}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColors(malikhediGhat.priority).badge}`}>
                        {getPriorityLabel(malikhediGhat.priority)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-xs leading-relaxed max-w-[200px]">
                      {malikhediGhat.primaryReason.length > 50
                        ? malikhediGhat.primaryReason.substring(0, 50) + '...'
                        : malikhediGhat.primaryReason}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGhat(malikhediGhat);
                        }}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs mx-auto"
                        title="View details and map"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 3: Third ghat - Dynamic priority */}
                  <tr
                    onClick={() => handleOpenGhat(kaliasotGhat)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                      {kaliasotGhat.rank}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                        {kaliasotGhat.site}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {kaliasotGhat.waterBody}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColors(kaliasotGhat.priority).badge}`}>
                        {getPriorityLabel(kaliasotGhat.priority)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 text-xs leading-relaxed max-w-[200px]">
                      {kaliasotGhat.primaryReason.length > 50
                        ? kaliasotGhat.primaryReason.substring(0, 50) + '...'
                        : kaliasotGhat.primaryReason}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGhat(kaliasotGhat);
                        }}
                        className="w-8 h-8 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs mx-auto"
                        title="View details and map"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;

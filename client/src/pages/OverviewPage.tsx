import React, { useState } from 'react';
import {
  MapPin,
  FileText,
  BarChart2,
  AlertTriangle,
  ArrowRight,
  Map as MapIcon,
  Flame,
  Users,
  ShieldAlert,
  Search,
  Info,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import type { GhatPriority, Measurement } from '../types';

interface OverviewPageProps {
  onSelectGhat: (siteName: string) => void;
  onOpenGhatDetail?: (ghat: GhatPriority) => void;
  onNavigateToTab: (tab: any) => void;
  onInspectEvidence: (measurement: Measurement) => void;
  language: 'en' | 'hi';
}

type GhatCategory = 'all' | 'dangerous' | 'populated' | 'attention';

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectGhat,
  onOpenGhatDetail,
  onNavigateToTab,
  language,
}) => {
  const metrics = dataService.getOverviewMetrics();
  const rankings = dataService.getSiteRankings();

  const [selectedCategory, setSelectedCategory] = useState<GhatCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenGhat = (ghat: GhatPriority) => {
    if (onOpenGhatDetail) {
      onOpenGhatDetail(ghat);
    } else {
      onSelectGhat(ghat.site);
    }
  };

  // Rule model classification helpers
  const isDangerous = (g: GhatPriority) => {
    return g.priority === 'high' || g.zeroDOCount > 0 || g.doExceedanceRate >= 40;
  };

  const isPopulated = (g: GhatPriority) => {
    const s = g.site.toLowerCase();
    return s.includes('bairagarh') || s.includes('prempura') || s.includes('khatlapura');
  };

  const isAttentionNeeded = (g: GhatPriority) => {
    return (
      g.legalStatus === 'prohibited' ||
      g.confidence === 'medium' ||
      g.durga2025Missing ||
      (g.coverageWarnings && g.coverageWarnings.length > 0) ||
      g.bodExceedanceRate >= 80
    );
  };

  // Find ranking objects for all 7 monitored ghats
  const bairagarhGhat = rankings.find((r) => r.site.toLowerCase().includes('bairagarh')) || rankings[0];
  const malikhediGhat = rankings.find((r) => r.site.toLowerCase().includes('malikhedi')) || rankings[1];
  const kamlaParkGhat = rankings.find((r) => r.site.toLowerCase().includes('kamla')) || rankings[2];
  const prempuraGhat = rankings.find((r) => r.site.toLowerCase().includes('prempura')) || rankings[3];
  const khatlapuraGhat = rankings.find((r) => r.site.toLowerCase().includes('khatlapura')) || rankings[4];
  const shahpuraGhat = rankings.find((r) => r.site.toLowerCase().includes('shahpura')) || rankings[5];
  const hathaikhedaGhat = rankings.find((r) => r.site.toLowerCase().includes('hathaikheda')) || rankings[6];

  // Category counts
  const dangerousCount = rankings.filter(isDangerous).length;
  const populatedCount = rankings.filter(isPopulated).length;
  const attentionCount = rankings.filter(isAttentionNeeded).length;

  // Filter rankings according to selected category and search query
  const filteredRankings = rankings.filter((g) => {
    if (selectedCategory === 'dangerous' && !isDangerous(g)) return false;
    if (selectedCategory === 'populated' && !isPopulated(g)) return false;
    if (selectedCategory === 'attention' && !isAttentionNeeded(g)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSite = g.site.toLowerCase().includes(q);
      const matchWater = g.waterBody.toLowerCase().includes(q);
      const matchReason = g.primaryReason.toLowerCase().includes(q);
      if (!matchSite && !matchWater && !matchReason) return false;
    }
    return true;
  });

  const isGhatHighlighted = (ghat?: GhatPriority) => {
    if (!ghat) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'dangerous') return isDangerous(ghat);
    if (selectedCategory === 'populated') return isPopulated(ghat);
    if (selectedCategory === 'attention') return isAttentionNeeded(ghat);
    return true;
  };

  return (
    <div className="relative min-h-[calc(100vh-62px)] overflow-hidden pb-12 font-sans">
      {/* Scenic Bhopal Lake Background - fully visible across entire page */}
      <div
        className="fixed inset-0 top-[53px] bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{
          backgroundImage: `url('/images/bhopal_lake_hero.jpg')`,
        }}
      />

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
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-5 flex flex-col justify-between space-y-4">
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
            <div className="relative w-full h-[270px] sm:h-[300px] rounded-xl overflow-hidden bg-[#eef5f3] border border-slate-200/90 shadow-inner select-none">
              <svg
                viewBox="0 0 700 380"
                className="w-full h-full object-cover"
                preserveAspectRatio="xMidYMid slice"
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

                {/* Lake Names Labels */}
                <text
                  x="220"
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
                  x="418"
                  y="312"
                  fill="#2c7799"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                  letterSpacing="0.3"
                >
                  Lower Lake
                </text>
                <text
                  x="475"
                  y="225"
                  fill="#475569"
                  fontSize="15"
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                >
                  Bhopal
                </text>

                {/* Subtle Dots for Other Ghats */}
                <circle cx="165" cy="240" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="360" cy="245" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="435" cy="275" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="475" cy="350" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="560" cy="180" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="95" cy="325" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
                <circle cx="380" cy="360" r="5" fill="#94a3b8" stroke="#ffffff" strokeWidth="2" />
              </svg>

              {/* Pin 1: Bairagarh kund (Upper Lake NW - High Priority) */}
              <div
                onClick={() => handleOpenGhat(bairagarhGhat)}
                className={`absolute top-[16%] left-[24%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(bairagarhGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Bairagarh (Sant Hirdaram) kund - High Priority (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-rose-300">
                  Bairagarh kund
                </div>
              </div>

              {/* Pin 2: Malikhedi kund (North bypass - High Priority) */}
              <div
                onClick={() => handleOpenGhat(malikhediGhat)}
                className={`absolute top-[18%] left-[58%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(malikhediGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Malikhedi kund - High Priority (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-rose-300">
                  Malikhedi kund
                </div>
              </div>

              {/* Pin 3: Rani Kamlapati / Kamla Park (Between Lakes - High Priority) */}
              <div
                onClick={() => handleOpenGhat(kamlaParkGhat)}
                className={`absolute top-[44%] left-[53%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(kamlaParkGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Rani Kamlapati / Kamla Park kund - High Priority (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-rose-300">
                  Kamla Park
                </div>
              </div>

              {/* Pin 4: Prempura ghat (Upper Lake SW - Heavy Immersion / Prohibited) */}
              <div
                onClick={() => handleOpenGhat(prempuraGhat)}
                className={`absolute bottom-[24%] left-[23%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(prempuraGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Prempura ghat - Major Staging Hub (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-amber-300">
                  Prempura
                </div>
              </div>

              {/* Pin 5: Khatlapura ghat (Lower Lake - Historic Crowd / Prohibited) */}
              <div
                onClick={() => handleOpenGhat(khatlapuraGhat)}
                className={`absolute top-[54%] left-[64%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(khatlapuraGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Khatlapura ghat - Historic Visarjan Ghat (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-amber-300">
                  Khatlapura
                </div>
              </div>

              {/* Pin 6: Shahpura lake ghat (South Bhopal - Medium Priority) */}
              <div
                onClick={() => handleOpenGhat(shahpuraGhat)}
                className={`absolute bottom-[14%] left-[68%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(shahpuraGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Shahpura lake ghat (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-amber-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-amber-300">
                  Shahpura
                </div>
              </div>

              {/* Pin 7: Hathaikheda dam / kund (East Peripheral - Low Priority) */}
              <div
                onClick={() => handleOpenGhat(hathaikhedaGhat)}
                className={`absolute top-[24%] left-[82%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 flex items-center gap-1.5 transition-all hover:scale-105 ${
                  isGhatHighlighted(hathaikhedaGhat) ? 'opacity-100' : 'opacity-40 hover:opacity-100'
                }`}
                title="Hathaikheda dam / kund (Click to view details)"
              >
                <div className="w-5 h-5 rounded-full bg-white border-2 border-emerald-500 shadow-md flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-200/90 shadow-2xs text-[10px] font-bold text-slate-800 whitespace-nowrap group-hover:border-emerald-300">
                  Hathaikheda
                </div>
              </div>

              {/* Bottom Right Floating Map Legend */}
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-md text-[10px] space-y-1 z-20 font-medium text-slate-700 pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>High Hazard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span>Medium / NGT Watch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span>Class B Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Feature Card: Monitored Immersion Ghats Table with Category Filter */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-5 flex flex-col justify-between space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg text-slate-700 bg-slate-100 mt-0.5">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {language === 'hi' ? 'निगरानी किए गए विसर्जन घाट' : 'Monitored Immersion Ghats'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {language === 'hi'
                      ? 'नियम मॉडल व एमपीपीसीबी जल गुणवत्ता डेटा के आधार पर वर्गीकृत'
                      : 'Categorized by rule model & MPCB water quality criteria (2023–2025)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('priorities')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-white hover:bg-teal-50/70 border border-teal-600/30 rounded-lg px-3 py-1.5 shadow-2xs transition-colors flex-shrink-0"
              >
                <span>{language === 'hi' ? 'पूर्ण मैट्रिक्स' : 'Priorities Matrix'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {/* Tab 1: All Ghats (Default) */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सभी घाट' : 'All Ghats'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    selectedCategory === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rankings.length}
                </span>
              </button>

              {/* Tab 2: Most Dangerous / High Concern */}
              <button
                onClick={() => setSelectedCategory('dangerous')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === 'dangerous'
                    ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100/90 border border-rose-200/70'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सबसे खतरनाक' : 'Most Dangerous'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    selectedCategory === 'dangerous' ? 'bg-white/25 text-white' : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  {dangerousCount}
                </span>
              </button>

              {/* Tab 3: Most Populated / Heavy Immersion */}
              <button
                onClick={() => setSelectedCategory('populated')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === 'populated'
                    ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100/90 border border-blue-200/70'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सर्वाधिक भीड़' : 'Most Populated'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    selectedCategory === 'populated' ? 'bg-white/25 text-white' : 'bg-blue-200 text-blue-800'
                  }`}
                >
                  {populatedCount}
                </span>
              </button>

              {/* Tab 4: Attention Needed / Regulatory & Data Watch */}
              <button
                onClick={() => setSelectedCategory('attention')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === 'attention'
                    ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-600'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100/90 border border-amber-200/70'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'विशेष ध्यान' : 'Attention Needed'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    selectedCategory === 'attention' ? 'bg-white/25 text-white' : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {attentionCount}
                </span>
              </button>
            </div>

            {/* Rule Model Explanatory Note */}
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2 transition-all ${
                selectedCategory === 'dangerous'
                  ? 'bg-rose-50/90 text-rose-900 border border-rose-200/80'
                  : selectedCategory === 'populated'
                  ? 'bg-blue-50/90 text-blue-900 border border-blue-200/80'
                  : selectedCategory === 'attention'
                  ? 'bg-amber-50/90 text-amber-900 border border-amber-200/80'
                  : 'bg-slate-50 text-slate-700 border border-slate-200/80'
              }`}
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold mr-1">
                  {selectedCategory === 'all' && (language === 'hi' ? 'सभी 7 घाट:' : 'All 7 Monitored Sites:')}
                  {selectedCategory === 'dangerous' && (language === 'hi' ? 'गंभीर जोखिम नियम:' : 'High Hazard Rule Model:')}
                  {selectedCategory === 'populated' && (language === 'hi' ? 'इन्फ्रास्ट्रक्चर नियम:' : 'Mass Immersion Capacity Rule:')}
                  {selectedCategory === 'attention' && (language === 'hi' ? 'कानूनी व डेटा नियम:' : 'Regulatory & Data Watch Rule:')}
                </span>
                {selectedCategory === 'dangerous' && (
                  language === 'hi'
                    ? 'विसर्जन पश्चात शून्य-DO (0.0 mg/L पूर्ण हाइपोक्सिया) और 40% से अधिक मानक घुलित ऑक्सीजन की कमी।'
                    : 'Triggered by post-immersion zero-DO events (0.0 mg/L complete anoxia) and >40% DO standard deficits.'
                )}
                {selectedCategory === 'populated' && (
                  language === 'hi'
                    ? 'नगर निगम के मुख्य जन-विसर्जन केंद्र — भारी हाइड्रोलिक क्रेन, फ्लोटिंग पोंटून व सर्वोच्च मूर्ति संख्या।'
                    : 'Primary municipal mass immersion hubs equipped with heavy mobile hydraulic cranes, pontoons & peak crowds.'
                )}
                {selectedCategory === 'attention' && (
                  language === 'hi'
                    ? 'एनजीटी न्यायिक आदेश (झील में विसर्जन वर्जित; चल टैंक आवश्यक) व एमपीपीसीबी रिपोर्ट नामकरण विसंगतियां।'
                    : 'Strict NGT natural lake bans (diversion to mobile tanks), geotextile barrier skimming & report naming gaps.'
                )}
                {selectedCategory === 'all' && (
                  language === 'hi'
                    ? 'सीपीसीबी क्लास बी मापदंडों (DO ≥ 5.0, BOD ≤ 3.0 mg/L) के आधार पर पूर्ण निगरानी रजिस्टर।'
                    : 'Full Bhopal municipal immersion registry evaluated against CPCB Class B bathing standards.'
                )}
              </div>
            </div>

            {/* Search and Count Filter Toolbar */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    language === 'hi'
                      ? 'घाट या झील का नाम खोजें...'
                      : 'Filter ghats by name or water body...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                />
              </div>
              <div className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                {language === 'hi'
                  ? `दर्शाए गए: ${filteredRankings.length} / ${rankings.length}`
                  : `Showing ${filteredRankings.length} of ${rankings.length}`}
              </div>
            </div>

            {/* Table Container - Scrollable to comfortably show all 7 ghats */}
            <div className="overflow-x-auto overflow-y-auto max-h-[360px] rounded-xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/90 sticky top-0 z-10">
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">GHAT / SITE</th>
                    <th className="py-2.5 px-3 text-center">STATUS</th>
                    <th className="py-2.5 px-3">KEY ASSESSMENT</th>
                    <th className="py-2.5 px-3 text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRankings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        {language === 'hi'
                          ? 'इस श्रेणी या खोज में कोई घाट नहीं मिला।'
                          : 'No ghats match the current filter or search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRankings.map((g) => {
                      const siteLower = g.site.toLowerCase();
                      const isZeroDO = g.zeroDOCount > 0;
                      const isProhibited = g.legalStatus === 'prohibited';
                      const isHighVolume = isPopulated(g);
                      const isMediumConf = g.confidence === 'medium';

                      // Determine contextual badge
                      let contextTag = null;
                      if (isZeroDO) {
                        contextTag = (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                            {g.zeroDOCount}x Zero-DO
                          </span>
                        );
                      } else if (isProhibited) {
                        contextTag = (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                            NGT Prohibited
                          </span>
                        );
                      } else if (isHighVolume) {
                        contextTag = (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                            Hydraulic Cranes
                          </span>
                        );
                      } else if (isMediumConf) {
                        contextTag = (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                            Naming Gap
                          </span>
                        );
                      } else if (g.priority === 'high') {
                        contextTag = (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/80">
                            High Deficit
                          </span>
                        );
                      } else {
                        contextTag = (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            Class B OK
                          </span>
                        );
                      }

                      // Key finding text depending on category view
                      let keyFinding = '';
                      if (selectedCategory === 'populated') {
                        if (siteLower.includes('prempura')) {
                          keyFinding = language === 'hi' ? 'उच्च-क्षमता हब; भारी क्रेन व पोंटून' : 'High-capacity staging; heavy hydraulic cranes & pontoons';
                        } else if (siteLower.includes('bairagarh')) {
                          keyFinding = language === 'hi' ? 'संत हिरदाराम नगर हब; कृत्रिम कुंड' : 'Sant Hirdaram Nagar hub; high-capacity artificial kund';
                        } else if (siteLower.includes('khatlapura')) {
                          keyFinding = language === 'hi' ? 'पारंपरिक निचली झील घाट; भारी भीड़' : 'Historic Lower Lake ghat; high crowd density & barricades';
                        }
                      } else if (selectedCategory === 'attention') {
                        if (isProhibited) {
                          keyFinding = language === 'hi' ? 'एनजीटी प्रतिबंध: झील में विसर्जन वर्जित; टैंक अनिवार्य' : 'NGT Ban: Direct lake immersion banned; mobile tanks required';
                        } else if (isMediumConf) {
                          keyFinding = language === 'hi' ? 'डेटा अंतर: गणेश vs दुर्गा नाम भ्रम' : 'Data gap: Ganesh vs Durga name ambiguity; Durga 2025 missing';
                        } else if (siteLower.includes('shahpura')) {
                          keyFinding = language === 'hi' ? '100% बीओडी उल्लंघन; जियोटेक्सटाइल बैरियर' : '100% BOD exceedance (up to 9.2 mg/l); barrier skimming';
                        }
                      }

                      if (!keyFinding) {
                        if (isZeroDO) {
                          keyFinding = language === 'hi' ? `${g.zeroDOCount} विसर्जन पश्चात शून्य-DO रीडिंग` : `${g.zeroDOCount} post-immersion zero-DO readings (0.0 mg/L)`;
                        } else if (g.doExceedanceRate >= 60) {
                          keyFinding = language === 'hi' ? `${g.doExceedanceRate}% घुलित ऑक्सीजन की गंभीर कमी` : `${g.doExceedanceRate}% chronic dissolved oxygen deficit`;
                        } else if (g.bodExceedanceRate === 100) {
                          keyFinding = language === 'hi' ? `100% बीओडी गैर-अनुपालन (औसतन ${g.parameterStats['BOD']?.avg ?? '—'} mg/l)` : `100% BOD non-compliance (avg ${g.parameterStats['BOD']?.avg ?? '—'} mg/L)`;
                        } else if (siteLower.includes('prempura')) {
                          keyFinding = language === 'hi' ? 'एनजीटी प्रतिबंध; भारी क्रेन पोंटून' : 'NGT banned in open lake; heavy hydraulic crane staging';
                        } else {
                          keyFinding = language === 'hi' ? 'संतुलित जल गुणवत्ता; सीमित प्रभाव' : 'Relatively stable water quality; Class B compliant';
                        }
                      }

                      return (
                        <tr
                          key={g.site}
                          onClick={() => handleOpenGhat(g)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-800">
                            {g.rank}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                              {g.site}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-400">
                                {g.waterBody}
                              </span>
                              {contextTag}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {g.priority === 'high' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/80">
                                High
                              </span>
                            ) : g.priority === 'medium' ? (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200/80">
                                Medium
                              </span>
                            ) : (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                                Lower
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-xs leading-relaxed max-w-[220px]">
                            {keyFinding}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenGhat(g);
                              }}
                              className="w-7 h-7 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs mx-auto"
                              title="View details and map"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
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

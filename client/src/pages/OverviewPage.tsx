import React from 'react';
import {
  MapPin,
  FileText,
  BarChart2,
  AlertTriangle,
  Info,
  ListFilter,
  Eye,
  ChevronRight,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { PriorityBadge } from '../components/common/Badge';
import type { GhatPriority, Measurement } from '../types';

interface OverviewPageProps {
  onSelectGhat: (siteName: string) => void;
  onOpenGhatDetail?: (ghat: GhatPriority) => void;
  onNavigateToTab: (tab: any) => void;
  onInspectEvidence: (measurement: Measurement) => void;
  language: 'en' | 'hi';
}

const GHAT_KEY_FINDINGS: Record<string, string> = {
  'Bairagarh (Sant Hirdaram) kund':
    '4 post-immersion zero-DO readings across available historical samples.',
  'Malikhedi kund':
    'Chronic dissolved oxygen deficits (69.2% failure rate) and elevated organic load.',
  'Khatlapura ghat':
    'Repeated BOD exceedances across multiple years (88.2% failure rate).',
  'Rani Kamlapati ghat / Kamla Park kund':
    '100% BOD exceedance with location ambiguity across Ganesh/Durga reports.',
  'Shahpura lake ghat':
    'Moderate DO depletion (27.8%) and continuous elevated BOD in lake basin.',
  'Prempura ghat':
    'Generally within thresholds with some isolated exceedances.',
  'Hathaikheda dam / kund':
    'Healthy dissolved oxygen (100% compliant ≥ 5.0 mg/l across all samples).',
};

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectGhat,
  onOpenGhatDetail,
  onNavigateToTab,
  onInspectEvidence,
  language,
}) => {
  const metrics = dataService.getOverviewMetrics();
  const rankings = dataService.getSiteRankings();
  const allMeasurements = dataService.getAllMeasurements();

  const handleOpenGhat = (ghat: GhatPriority) => {
    if (onOpenGhatDetail) {
      onOpenGhatDetail(ghat);
    } else {
      onSelectGhat(ghat.site);
    }
  };

  const handleViewEvidenceForGhat = (ghat: GhatPriority) => {
    // Pick the most critical representative reading for this site
    const siteRecords = allMeasurements.filter((m) => m.site === ghat.site);
    const critical =
      siteRecords.find((m) => m.parameter === 'Dissolved oxygen' && m.numericValue === 0) ||
      siteRecords.find((m) => m.parameter === 'Dissolved oxygen' && m.comparison.isViolation) ||
      siteRecords.find((m) => m.parameter === 'BOD' && m.comparison.isViolation) ||
      siteRecords[0];

    if (critical) {
      onInspectEvidence(critical);
    } else {
      onSelectGhat(ghat.site);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Notice Banner */}
      <div className="bg-[#f0f7f6] border border-[#d2ebe6] rounded-xl p-3.5 px-4 flex items-start space-x-3 text-xs sm:text-sm text-slate-600 shadow-2xs">
        <div className="p-0.5 text-teal-600 flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <span className="font-semibold text-slate-800">
            {language === 'hi'
              ? 'ऐतिहासिक डेटा · 2023–2025:'
              : 'Historical data · 2023–2025:'}
          </span>{' '}
          {language === 'hi'
            ? 'निष्कर्ष पिछली चिंताओं और डेटा अंतरालों की पहचान करते हैं, वर्तमान जल गुणवत्ता की नहीं।'
            : 'Findings identify past concerns and data gaps, not current water quality.'}
          <div className="text-slate-500 text-xs mt-0.5">
            {language === 'hi'
              ? 'मूर्ति विसर्जन संचालन से पूर्व वर्तमान मापों के साथ ऑन-साइट सत्यापन आवश्यक है।'
              : 'On-site verification with current measurements is required before idol immersion operations.'}
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Verified Ghats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
            <MapPin className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              {language === 'hi' ? 'सत्यापित घाट' : 'VERIFIED GHATS'}
            </div>
            <div className="text-2xl sm:text-[28px] font-bold text-slate-900 leading-tight mt-0.5">
              {metrics.totalGhats}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              {language === 'hi'
                ? 'भोपाल के शहरी जल स्रोतों में निगरानी'
                : 'Monitored across Bhopal urban water bodies'}
            </p>
          </div>
        </div>

        {/* Card 2: Total Records */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 flex-shrink-0">
            <FileText className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              {language === 'hi' ? 'कुल रिकॉर्ड्स' : 'TOTAL RECORDS'}
            </div>
            <div className="text-2xl sm:text-[28px] font-bold text-slate-900 leading-tight mt-0.5">
              {metrics.totalRecords.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              {language === 'hi'
                ? '3 वार्षिक MPPCB रिपोर्टों में 14 कॉलम'
                : '14 columns across 3 annual MPPCB reports'}
            </p>
          </div>
        </div>

        {/* Card 3: Valid Measurements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <BarChart2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              {language === 'hi' ? 'वैध माप' : 'VALID MEASUREMENTS'}
            </div>
            <div className="text-2xl sm:text-[28px] font-bold text-slate-900 leading-tight mt-0.5">
              {metrics.validNumericMeasurements.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              {language === 'hi'
                ? 'मापे गए रासायनिक एवं भौतिक परीक्षण'
                : 'Quantified chemical & physical readings'}
            </p>
          </div>
        </div>

        {/* Card 4: Data-Quality Caveats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              {language === 'hi' ? 'डेटा गुणवत्ता ऑडिट' : 'DATA-QUALITY CAVEATS'}
            </div>
            <div className="text-2xl sm:text-[28px] font-bold text-slate-900 leading-tight mt-0.5">
              {metrics.nonNumericOrFlagged}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              174 BDL, 57 not sampled, 4 zero DO
            </p>
          </div>
        </div>
      </div>

      {/* Main Priority Ranking Section */}
      <div className="space-y-3.5 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {language === 'hi'
                ? 'विसर्जन घाट ऐतिहासिक प्राथमिकता क्रम'
                : 'Visarjan Ghat Historical Priority Ranking'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {language === 'hi'
                ? 'जैविक ऑक्सीजन ह्रास, मानक उल्लंघन दर एवं डेटा अंतरालों के आधार पर निर्धारित।'
                : 'Ranked deterministically by biological oxygen collapse, exceedance rates, and coverage gaps.'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('priorities')}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 bg-white hover:bg-teal-50/70 border border-teal-600/30 rounded-lg px-3.5 py-2 shadow-2xs transition-colors self-start sm:self-auto"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'पूर्ण फिल्टर करने योग्य तालिका देखें' : 'View full filterable table'}</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Priority Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-[#f8fafc] text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-5">
                    <div>GHAT / SITE NAME</div>
                    <div className="text-[10px] font-normal text-slate-400 capitalize -mt-0.5">Water body</div>
                  </th>
                  <th className="py-3.5 px-4">HISTORICAL PRIORITY</th>
                  <th className="py-3.5 px-5">KEY FINDING</th>
                  <th className="py-3.5 px-4 text-center">
                    <div>DO BELOW</div>
                    <div className="text-[10px] font-normal text-slate-400 -mt-0.5">5 MG/L</div>
                  </th>
                  <th className="py-3.5 px-4 text-center">
                    <div>BOD ABOVE</div>
                    <div className="text-[10px] font-normal text-slate-400 -mt-0.5">3 MG/L</div>
                  </th>
                  <th className="py-3.5 px-4 text-center">VALID SAMPLES</th>
                  <th className="py-3.5 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankings.map((ghat: GhatPriority) => {
                  const doStat = ghat.parameterStats['Dissolved oxygen'];
                  const bodStat = ghat.parameterStats['BOD'];
                  const keyFinding =
                    GHAT_KEY_FINDINGS[ghat.site] || ghat.primaryReason;

                  return (
                    <tr
                      key={ghat.site}
                      onClick={() => handleOpenGhat(ghat)}
                      className="hover:bg-teal-50/60 cursor-pointer transition-colors group"
                      title={language === 'hi' ? 'घाट का विवरण एवं मानचित्र स्थान देखने के लिए क्लिक करें' : 'Click to inspect ghat details and view location on map'}
                    >
                      {/* Rank */}
                      <td className="py-4 px-4 text-center font-bold text-slate-800 text-sm">
                        {ghat.rank}
                      </td>

                      {/* Ghat Name & Water body */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 text-sm leading-snug flex items-center gap-1.5 transition-colors">
                          <span>{ghat.site}</span>
                          <MapPin className="w-3.5 h-3.5 text-teal-600 opacity-60 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{ghat.waterBody}</span>
                          <span className="text-[10px] text-teal-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            · {language === 'hi' ? 'मानचित्र देखें' : 'View on map'}
                          </span>
                        </div>
                      </td>

                      {/* Historical Priority Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <PriorityBadge priority={ghat.priority} />
                      </td>

                      {/* Key Finding */}
                      <td className="py-4 px-5 text-xs text-slate-600 max-w-sm leading-relaxed">
                        {keyFinding}
                      </td>

                      {/* DO Below 5 mg/l */}
                      <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                        <div
                          className={`text-sm font-bold ${
                            ghat.doExceedanceRate > 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {doStat ? `${doStat.exceedanceCount}/${doStat.validCount}` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ({ghat.doExceedanceRate}%)
                        </div>
                      </td>

                      {/* BOD Above 3 mg/l */}
                      <td className="py-4 px-4 text-center font-mono whitespace-nowrap">
                        <div
                          className={`text-sm font-bold ${
                            ghat.bodExceedanceRate > 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {bodStat ? `${bodStat.exceedanceCount}/${bodStat.validCount}` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ({ghat.bodExceedanceRate}%)
                        </div>
                      </td>

                      {/* Valid Samples */}
                      <td className="py-4 px-4 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                        {ghat.validNumericCount} / {ghat.totalRecords}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGhat(ghat);
                            }}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100/90 border border-slate-300 rounded-lg px-2.5 py-1.5 transition-colors shadow-2xs"
                            title={language === 'hi' ? 'मानचित्र एवं विवरण खोलें' : 'Open details and map'}
                          >
                            <MapPin className="w-3.5 h-3.5 text-teal-600" />
                            <span>{language === 'hi' ? 'मानचित्र व विवरण' : 'Details & Map'}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEvidenceForGhat(ghat);
                            }}
                            className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-800 bg-white hover:bg-teal-50 border border-teal-600/30 rounded-lg px-2.5 py-1.5 transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'साक्ष्य' : 'Evidence'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

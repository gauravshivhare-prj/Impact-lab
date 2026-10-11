import React from 'react';
import {
  AlertTriangle,
  FileCheck2,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dataService } from '../services/dataService';
import { PriorityBadge, ConfidenceBadge } from '../components/common/Badge';
import type { GhatPriority, Measurement } from '../types';

interface OverviewPageProps {
  onSelectGhat: (siteName: string) => void;
  onNavigateToTab: (tab: any) => void;
  onInspectEvidence: (measurement: Measurement) => void;
  language: 'en' | 'hi';
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onSelectGhat,
  onNavigateToTab,
  onInspectEvidence,
  language,
}) => {
  const metrics = dataService.getOverviewMetrics();
  const rankings = dataService.getSiteRankings();
  const allMeasurements = dataService.getAllMeasurements();

  // Prepare chart data: DO and BOD exceedance rates for the 7 sites
  const chartData = rankings.map((r) => ({
    name: r.site.replace(' (Sant Hirdaram) kund', '').replace(' / Kamla Park kund', '').replace(' dam / kund', ''),
    fullName: r.site,
    'DO Deficit (< 5 mg/l) %': r.doExceedanceRate,
    'BOD Excess (> 3 mg/l) %': r.bodExceedanceRate,
  }));

  // Find sample records for the critical attention items
  const zeroDoRecord = allMeasurements.find(
    (m) => m.parameter === 'Dissolved oxygen' && m.numericValue === 0
  );
  const mediumConfRecord = allMeasurements.find(
    (m) => m.siteMatchConfidence === 'medium'
  );
  const missingCoverageRecord = allMeasurements.find(
    (m) => m.site === 'Bairagarh (Sant Hirdaram) kund' && m.year === 2025
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Restrained Historical Notice */}
      <div className="bg-slate-100/90 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-md flex items-start space-x-2.5 text-xs sm:text-sm">
        <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">
          <strong className="font-semibold text-slate-900">
            {language === 'hi' ? 'ऐतिहासिक डेटा · 2023–2025:' : 'Historical data · 2023–2025:'}
          </strong>{' '}
          {language === 'hi'
            ? 'यह निष्कर्ष म.प्र. प्रदूषण नियंत्रण बोर्ड के पिछले आंकड़ों और साक्ष्यों को दर्शाते हैं, वर्तमान जल गुणवत्ता को नहीं। विसर्जन से पूर्व नए परीक्षण अनिवार्य हैं।'
            : 'Findings identify past concerns and data gaps, not current water quality. On-site verification is required before idol immersion operations.'}
        </p>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>{language === 'hi' ? 'सत्यापित विसर्जन घाट' : 'Verified Ghats'}</span>
            <FileCheck2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.totalGhats}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? 'भोपाल नगर निगम सीमा अंतर्गत' : 'Monitored across Bhopal urban water bodies'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>{language === 'hi' ? 'कुल रिकॉर्ड्स' : 'Total Records'}</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.totalRecords.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? '2023–2025 गणेश एवं दुर्गा रिपोर्ट' : '14 columns across 3 annual MPPCB reports'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>{language === 'hi' ? 'वैध संख्यात्मक माप' : 'Valid Measurements'}</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.validNumericMeasurements.toLocaleString()}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? '84.6% परीक्षणों में संख्यात्मक डेटा' : 'Quantified chemical & physical readings'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider">
            <span>{language === 'hi' ? 'डेटा गुणवत्ता ऑडिट' : 'Data-Quality Caveats'}</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.nonNumericOrFlagged}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? '174 BDL, 57 अप्राप्त, 228 मध्यम विश्वसनीयता' : '174 BDL, 57 not sampled, 4 zero DO'}
          </p>
        </div>
      </div>

      {/* Main Focus: Ghat Priority Ranking Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {language === 'hi' ? 'विसर्जन घाट प्राथमिकता क्रम' : 'Visarjan Ghat Historical Priority Ranking'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'hi'
                ? 'घुलित ऑक्सीजन (DO), बीओडी (BOD), एवं डेटा कवरेज पर आधारित पारदर्शी वर्गीकरण'
                : 'Ranked deterministically by biological oxygen collapse, exceedance rates, and coverage gaps'}
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('priorities')}
            className="inline-flex items-center text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors"
          >
            <span>{language === 'hi' ? 'विस्तृत फिल्टर देखें' : 'View full filterable table'}</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {/* Priority Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Ghat / Site Name</th>
                <th className="py-3 px-4">Water Body</th>
                <th className="py-3 px-4">Historical Priority</th>
                <th className="py-3 px-4">Primary Empirical Finding</th>
                <th className="py-3 px-4 text-center">DO &lt; 5 mg/l</th>
                <th className="py-3 px-4 text-center">BOD &gt; 3 mg/l</th>
                <th className="py-3 px-4 text-center">Valid Samples</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankings.map((ghat: GhatPriority) => {
                const doStat = ghat.parameterStats['Dissolved oxygen'];
                const bodStat = ghat.parameterStats['BOD'];

                return (
                  <tr key={ghat.site} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                      {ghat.rank}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <span>{ghat.site}</span>
                        {ghat.confidence === 'medium' && (
                          <ConfidenceBadge confidence="medium" />
                        )}
                      </div>
                      {ghat.durga2025Missing && (
                        <span className="text-[11px] text-amber-700 font-normal block mt-0.5">
                          Missing Durga 2025 table in report
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {ghat.waterBody}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <PriorityBadge priority={ghat.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-sm">
                      {ghat.primaryReason}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                      <span className={ghat.doExceedanceRate > 0 ? 'text-rose-700 font-semibold' : 'text-emerald-700'}>
                        {doStat ? `${doStat.exceedanceCount}/${doStat.validCount}` : '—'}
                      </span>
                      <span className="text-slate-400 ml-1">({ghat.doExceedanceRate}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs whitespace-nowrap">
                      <span className={ghat.bodExceedanceRate > 50 ? 'text-amber-800 font-semibold' : 'text-slate-700'}>
                        {bodStat ? `${bodStat.exceedanceCount}/${bodStat.validCount}` : '—'}
                      </span>
                      <span className="text-slate-400 ml-1">({ghat.bodExceedanceRate}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-600 whitespace-nowrap">
                      {ghat.validNumericCount} / {ghat.totalRecords}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectGhat(ghat.site)}
                        className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline px-2 py-1 rounded"
                      >
                        Inspect Ghat
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Section: DO vs BOD Exceedances Across Sites */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {language === 'hi'
                ? 'घाट-वार गैर-अनुपालन दर (DO एवं BOD)'
                : 'Threshold Exceedance Rates by Immersion Site'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              CPCB Class B limits: Dissolved Oxygen &ge; 5.0 mg/l (lower is worse) · BOD &le; 3.0 mg/l (higher is worse)
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Source: MPPCB Reports 2023–2025
          </div>
        </div>

        <div className="h-64 sm:h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 11, fill: '#475569' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(val: any) => [`${val}%`, '']}
                labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || ''}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                iconType="rect"
              />
              <Bar
                dataKey="DO Deficit (< 5 mg/l) %"
                fill="#e11d48"
                radius={[3, 3, 0, 0]}
                name="DO Deficit Rate (Below 5 mg/l)"
              />
              <Bar
                dataKey="BOD Excess (> 3 mg/l) %"
                fill="#d97706"
                radius={[3, 3, 0, 0]}
                name="BOD Exceedance Rate (Above 3 mg/l)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Findings Requiring Immediate Attention */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            {language === 'hi' ? 'विशेष ध्यान योग्य प्रमुख साक्ष्य' : 'Historical Findings Requiring Officer Attention'}
          </h3>
          <span className="text-xs text-slate-500">
            Traceable to official report pages
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Finding 1: Zero DO Collapse */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-rose-700 text-xs font-semibold mb-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Zero Dissolved Oxygen (4 Events)</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                Bairagarh (Sant Hirdaram) kund
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                DO measured at 0.0 mg/l (complete anoxia / biological dead zone) four times across 2023 & 2025. Water at zero oxygen cannot support fish and breaches the 5.0 mg/l standard.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Report 2025, p. 28
              </span>
              {zeroDoRecord && (
                <button
                  onClick={() => onInspectEvidence(zeroDoRecord)}
                  className="text-xs font-medium text-teal-700 hover:text-teal-900"
                >
                  Inspect Evidence &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Finding 2: Missing Durga 2025 Table */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-amber-700 text-xs font-semibold mb-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Monitoring Coverage Gap</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                Bairagarh & Malikhedi Kunds
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Neither site has a Durga 2025 data table in the official MPPCB report (only 192 rows instead of 228). Missing tests must not be mistaken for clean water.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Coverage: 192/228
              </span>
              {missingCoverageRecord && (
                <button
                  onClick={() => onInspectEvidence(missingCoverageRecord)}
                  className="text-xs font-medium text-teal-700 hover:text-teal-900"
                >
                  Inspect Evidence &rarr;
                </button>
              )}
            </div>
          </div>

          {/* Finding 3: Uncertain Site Mapping */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-blue-700 text-xs font-semibold mb-1.5">
                <Info className="w-4 h-4" />
                <span>Site Ambiguity (Medium Confidence)</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                Rani Kamlapati / Kamla Park kund
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ganesh tables cite "Kamla Park kund" while Durga tables cite "Lower Lake ghat". Officer field physical demarcation is required prior to idol deployment.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Confidence: Medium
              </span>
              {mediumConfRecord && (
                <button
                  onClick={() => onInspectEvidence(mediumConfRecord)}
                  className="text-xs font-medium text-teal-700 hover:text-teal-900"
                >
                  Inspect Evidence &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

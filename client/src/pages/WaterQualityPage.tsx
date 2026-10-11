import { useState } from 'react';
import {
  ExternalLink,
  Info,
  Calendar,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { dataService } from '../services/dataService';
import { PriorityBadge, ConfidenceBadge } from '../components/common/Badge';

interface WaterQualityPageProps {
  selectedSite: string;
  onSelectSite: (siteName: string) => void;
  onNavigateToEvidenceWithSite: (siteName: string, param?: string) => void;
  language?: 'en' | 'hi';
}

export const WaterQualityPage: React.FC<WaterQualityPageProps> = ({
  selectedSite,
  onSelectSite,
  onNavigateToEvidenceWithSite,
}) => {
  const allRankings = dataService.getSiteRankings();
  const currentSiteName = selectedSite || allRankings[0]?.site || 'Bairagarh (Sant Hirdaram) kund';
  const siteDetails = dataService.getGhatDetails(currentSiteName);
  const siteMeasurements = dataService.getMeasurementsForSite(currentSiteName);

  const [activeParamTab, setActiveParamTab] = useState<'Dissolved oxygen' | 'BOD' | 'pH'>('Dissolved oxygen');

  if (!siteDetails) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <p className="text-slate-500">Site information not found.</p>
      </div>
    );
  }

  // Build trend chart data for active parameter
  const trendRecords = siteMeasurements
    .filter((m) => m.parameter === activeParamTab && m.status === 'valid_numeric')
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const phaseOrder: Record<string, number> = { pre: 1, during: 2, after: 3 };
      return (phaseOrder[a.phase] || 0) - (phaseOrder[b.phase] || 0);
    });

  const chartData = trendRecords.map((m) => ({
    label: `${m.year} ${m.festival} (${m.phase})`,
    year: m.year,
    festival: m.festival,
    phase: m.phase,
    value: m.numericValue,
    page: m.sourcePage,
    rawText: m.valueAsPrinted,
  }));

  const paramStats = siteDetails.parameterStats;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Site Selector Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Select Immersion Ghat:
          </span>
          <div className="relative">
            <select
              value={currentSiteName}
              onChange={(e) => onSelectSite(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-300 rounded px-3 py-1.5 pr-8 text-xs sm:text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              {allRankings.map((r) => (
                <option key={r.site} value={r.site}>
                  #{r.rank} {r.site} ({r.waterBody})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={() => onNavigateToEvidenceWithSite(currentSiteName)}
          className="inline-flex items-center text-xs font-medium text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded transition-colors"
        >
          <span>View all {siteMeasurements.length} raw readings in Evidence Explorer</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
        </button>
      </div>

      {/* Site Summary Banner */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {siteDetails.site}
              </h2>
              <span className="text-sm text-slate-500">
                · {siteDetails.waterBody}
              </span>
              <PriorityBadge priority={siteDetails.priority} />
              <ConfidenceBadge confidence={siteDetails.confidence} />
            </div>

            <p className="text-xs sm:text-sm text-slate-700 mt-2 font-medium leading-relaxed max-w-3xl">
              {siteDetails.primaryReason}
            </p>
          </div>

          <div className="flex md:flex-col items-end gap-2 text-xs text-slate-500 flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Evidence: {siteDetails.yearsCovered.join(', ')}</span>
            </div>
            <div>
              Total Records: <strong className="font-mono text-slate-800">{siteDetails.totalRecords}</strong>
            </div>
            <div>
              Valid Numeric: <strong className="font-mono text-slate-800">{siteDetails.validNumericCount}</strong>
            </div>
          </div>
        </div>

        {/* Coverage warning notice if applicable */}
        {siteDetails.durga2025Missing && (
          <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200 rounded text-xs text-amber-900 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Sampling Coverage Caveat:</strong> No Durga 2025 table is present in the official MPPCB report for this site. The absence of data does NOT certify clean water; on-site pre-immersion testing is urgently recommended.
            </div>
          </div>
        )}
      </div>

      {/* CPCB Class B Criteria Reference Box */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs text-slate-700 flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-slate-900">Configured Benchmark Standard:</strong> Initial comparisons are conducted against <strong>CPCB Class B (Outdoor Bathing)</strong> standards: Dissolved Oxygen &ge; 5.0 mg/l, BOD &le; 3.0 mg/l, and pH 6.5–8.5. Parameters without official Class B limits (COD, heavy metals, total/dissolved solids, turbidity) are displayed honestly without fabricated risk ratings.
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="bg-white p-5 rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Historical Test Progression ({activeParamTab})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Across Pre, During, and Post-visarjan monitoring stages (2023–2025)
            </p>
          </div>

          {/* Parameter selector tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded">
            {(['Dissolved oxygen', 'BOD', 'pH'] as const).map((param) => (
              <button
                key={param}
                onClick={() => setActiveParamTab(param)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                  activeParamTab === param
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {param === 'Dissolved oxygen' ? 'DO (mg/l)' : param === 'BOD' ? 'BOD (mg/l)' : 'pH'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View */}
        <div className="h-64 sm:h-72 mt-4">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Insufficient numeric records to display reliable trend line.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 25, left: -10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ${activeParamTab === 'pH' ? '' : 'mg/l'}`, activeParamTab]}
                />
                {activeParamTab === 'Dissolved oxygen' && (
                  <ReferenceLine
                    y={5.0}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: 'CPCB Class B Min (5.0 mg/l)',
                      position: 'insideTopRight',
                      fill: '#dc2626',
                      fontSize: 10,
                    }}
                  />
                )}
                {activeParamTab === 'BOD' && (
                  <ReferenceLine
                    y={3.0}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: 'CPCB Class B Max (3.0 mg/l)',
                      position: 'insideTopRight',
                      fill: '#dc2626',
                      fontSize: 10,
                    }}
                  />
                )}
                {activeParamTab === 'pH' && (
                  <>
                    <ReferenceLine y={6.5} stroke="#dc2626" strokeDasharray="4 4" />
                    <ReferenceLine y={8.5} stroke="#dc2626" strokeDasharray="4 4" />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0f766e' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Complete Parameter Statistics Table (All 13 Parameters) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Full Parameter Breakdown (13 Tests)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Statistics calculated strictly over verified numeric measurements. BDL/ND/Unsampled excluded from zero computations.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Standard / Benchmark</th>
                <th className="py-3 px-4 text-center">Valid Samples</th>
                <th className="py-3 px-4 text-center">Min</th>
                <th className="py-3 px-4 text-center">Avg</th>
                <th className="py-3 px-4 text-center">Max</th>
                <th className="py-3 px-4 text-center">Exceedances</th>
                <th className="py-3 px-4 text-center">BDL / ND</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {Object.values(paramStats).map((stat) => {
                const isConfigured = stat.hasConfiguredThreshold;
                const hasExceedances = stat.exceedanceCount > 0;

                return (
                  <tr key={stat.parameter} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {stat.parameter}
                      {stat.unit && <span className="text-slate-400 text-xs ml-1 font-mono">({stat.unit})</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {isConfigured ? (
                        <span className="font-mono text-slate-800">{stat.thresholdDescription}</span>
                      ) : (
                        <span className="text-slate-400 italic">No Class B limit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {stat.validCount} / {stat.totalRecords}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {stat.min !== null ? stat.min : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {stat.avg !== null ? stat.avg : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {stat.max !== null ? stat.max : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      {isConfigured ? (
                        <span className={hasExceedances ? 'text-rose-700 font-bold' : 'text-emerald-700'}>
                          {stat.exceedanceCount} ({stat.exceedancePercentage}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-500">
                      {stat.bdlCount > 0 || stat.ndCount > 0 ? (
                        <span>{stat.bdlCount} BDL / {stat.ndCount} ND</span>
                      ) : (
                        <span>0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigateToEvidenceWithSite(currentSiteName, stat.parameter)}
                        className="text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline"
                      >
                        Evidence
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

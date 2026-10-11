import { useState, useMemo } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Download,
  Search,
  RotateCcw,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ConfidenceBadge } from '../components/common/Badge';
import type { Measurement } from '../types';

interface DataQualityPageProps {
  onInspectRecord: (measurement: Measurement) => void;
  language?: 'en' | 'hi';
}

export const DataQualityPage: React.FC<DataQualityPageProps> = ({
  onInspectRecord,
}) => {
  const [issueTypeFilter, setIssueTypeFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allIssues = dataService.getDataQualityIssues();
  const allRankings = dataService.getSiteRankings();
  const allMeasurements = dataService.getAllMeasurements();

  // Summary counts
  const bdlCount = allIssues.filter((i) => i.type === 'bdl').length;
  const ndCount = allIssues.filter((i) => i.type === 'nd').length;
  const notSampledCount = allIssues.filter((i) => i.type === 'not_sampled').length;
  const zeroDOCount = allIssues.filter((i) => i.type === 'zero_reading').length;
  const medConfCount = allIssues.filter((i) => i.type === 'medium_confidence').length;

  const sites = Array.from(new Set(allRankings.map((r) => r.site)));

  // Filter issues
  const filteredIssues = useMemo(() => {
    return allIssues.filter((issue) => {
      if (issueTypeFilter !== 'all' && issue.type !== issueTypeFilter) return false;
      if (siteFilter !== 'all' && issue.site !== siteFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchSite = issue.site.toLowerCase().includes(q);
        const matchParam = issue.parameter.toLowerCase().includes(q);
        const matchDesc = issue.description.toLowerCase().includes(q);
        if (!matchSite && !matchParam && !matchDesc) return false;
      }
      return true;
    });
  }, [allIssues, issueTypeFilter, siteFilter, searchQuery]);

  const handleExportIssues = () => {
    const headers = [
      'Issue Type',
      'Severity',
      'Site',
      'Year',
      'Festival',
      'Phase',
      'Parameter',
      'Report Printed Text',
      'Description',
    ];
    const rows = filteredIssues.map((i) => [
      `"${i.type}"`,
      `"${i.severity}"`,
      `"${i.site}"`,
      i.year,
      `"${i.festival}"`,
      `"${i.phase}"`,
      `"${i.parameter}"`,
      `"${i.record.valueAsPrinted}"`,
      `"${i.description}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ghatwatch_data_quality_issues.csv';
    link.click();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Mandatory Data Rules Callout */}
      <div className="bg-slate-900 text-slate-100 p-4 sm:p-5 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Core Municipal Data Integrity Principles</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-300">
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <strong className="text-white block mb-0.5">Missing is not clean:</strong>
            Unsampled or blank entries are gaps in surveillance, never proof of compliance.
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <strong className="text-white block mb-0.5">BDL & ND are not zero:</strong>
            BDL reflects instrument detection threshold; it indicates trace presence, not absolute zero.
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <strong className="text-white block mb-0.5">Medium confidence highlighted:</strong>
            Locations with ambiguous historical naming require physical verification.
          </div>
          <div className="bg-slate-800/80 p-2.5 rounded border border-slate-700">
            <strong className="text-white block mb-0.5">Always show denominators:</strong>
            Exceedance rates are only evaluated against verified valid numeric tests.
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Below Detection (BDL/ND)</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{bdlCount + ndCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{bdlCount} BDL · {ndCount} ND (Metals)</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Not Sampled / Blanks</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">{notSampledCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Excluded from denominators</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Medium-Confidence Records</div>
          <div className="text-xl font-bold font-mono text-amber-700 mt-1">{medConfCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Kamla Park / Lower Lake ghat</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Zero DO Alert Events</div>
          <div className="text-xl font-bold font-mono text-rose-700 mt-1">{zeroDOCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">0.0 mg/l severe hypoxia</p>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200 col-span-2 lg:col-span-1">
          <div className="text-xs text-slate-500 font-medium">Missing Report Tables</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">2 Sites</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Bairagarh & Malikhedi (Durga '25)</p>
        </div>
      </div>

      {/* Site-by-Site Coverage and Quality Audit Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">
            Site-Level Monitoring Coverage & Confidence Audit
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit of data completeness, sample counts, and naming integrity across all 7 sites.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Immersion Site</th>
                <th className="py-2.5 px-4">Water Body</th>
                <th className="py-2.5 px-4 text-center">Naming Confidence</th>
                <th className="py-2.5 px-4 text-center">Total Rows</th>
                <th className="py-2.5 px-4 text-center">Valid Numeric</th>
                <th className="py-2.5 px-4 text-center">BDL / ND</th>
                <th className="py-2.5 px-4 text-center">Not Sampled</th>
                <th className="py-2.5 px-4">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allRankings.map((ghat) => {
                const siteRecs = allMeasurements.filter((m) => m.site === ghat.site);
                const bdlSite = siteRecs.filter((m) => m.status === 'bdl' || m.status === 'nd').length;
                const notSampledSite = siteRecs.filter((m) => m.status === 'not_sampled').length;

                return (
                  <tr key={ghat.site} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{ghat.site}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">{ghat.waterBody}</td>
                    <td className="py-3 px-4 text-center">
                      <ConfidenceBadge confidence={ghat.confidence} />
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs">{ghat.totalRecords}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs font-semibold text-teal-800">
                      {ghat.validNumericCount}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">{bdlSite}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs text-slate-600">{notSampledSite}</td>
                    <td className="py-3 px-4 text-xs">
                      {ghat.durga2025Missing ? (
                        <span className="text-amber-800 font-medium">
                          Incomplete (Durga 2025 table absent)
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Complete (3-year continuous)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filterable Issues Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs space-y-3 p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Granular Data-Quality Caveats & Anomaly Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific records carrying caveats, non-numeric flags, or mapping uncertainties.
            </p>
          </div>

          <button
            onClick={handleExportIssues}
            className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Export Issues CSV ({filteredIssues.length})
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter caveats..."
              className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={issueTypeFilter}
            onChange={(e) => setIssueTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700"
          >
            <option value="all">All Caveat Types</option>
            <option value="zero_reading">Zero DO Collapse (Alert)</option>
            <option value="medium_confidence">Medium Naming Confidence</option>
            <option value="not_sampled">Not Sampled / Blanks</option>
            <option value="bdl">BDL (Below Detection)</option>
            <option value="nd">ND (Not Detected)</option>
          </select>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded p-1 text-slate-700"
          >
            <option value="all">All Sites</option>
            {sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {(issueTypeFilter !== 'all' || siteFilter !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => { setIssueTypeFilter('all'); setSiteFilter('all'); setSearchQuery(''); }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center px-2 py-1"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </button>
          )}
        </div>

        {/* Issues list table */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Caveat Type</th>
                <th className="py-2.5 px-3">Site</th>
                <th className="py-2.5 px-3">Year / Phase</th>
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Printed Text</th>
                <th className="py-2.5 px-3">Audit Details</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIssues.slice(0, 50).map((issue) => (
                <tr key={issue.id} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 whitespace-nowrap">
                    {issue.severity === 'alert' ? (
                      <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-semibold text-[10px] uppercase">
                        Alert
                      </span>
                    ) : issue.severity === 'warning' ? (
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-semibold text-[10px] uppercase">
                        Warning
                      </span>
                    ) : (
                      <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] uppercase">
                        Info
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 capitalize font-medium text-slate-800 whitespace-nowrap">
                    {issue.type.replace('_', ' ')}
                  </td>
                  <td className="py-2 px-3 text-slate-900 font-medium whitespace-nowrap">
                    {issue.site}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                    {issue.year} {issue.festival} ({issue.phase})
                  </td>
                  <td className="py-2 px-3 text-slate-800 whitespace-nowrap font-medium">
                    {issue.parameter}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                    "{issue.record.valueAsPrinted}"
                  </td>
                  <td className="py-2 px-3 text-slate-600 text-xs">
                    {issue.description}
                  </td>
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => onInspectRecord(issue.record)}
                      className="text-teal-700 hover:text-teal-900 font-semibold text-xs"
                    >
                      Drawer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredIssues.length > 50 && (
          <div className="text-xs text-slate-500 text-center pt-2">
            Showing first 50 of {filteredIssues.length} issues. Use filters or export CSV for full list.
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useMemo } from 'react';
import {
  Search,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { ComparisonBadge, ConfidenceBadge } from '../components/common/Badge';
import type { Measurement } from '../types';

interface EvidenceExplorerPageProps {
  initialSite?: string;
  initialParameter?: string;
  onInspectRecord: (measurement: Measurement) => void;
  language?: 'en' | 'hi';
}

export const EvidenceExplorerPage: React.FC<EvidenceExplorerPageProps> = ({
  initialSite = 'all',
  initialParameter = 'all',
  onInspectRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [siteFilter, setSiteFilter] = useState(initialSite);
  const [yearFilter, setYearFilter] = useState('all');
  const [festivalFilter, setFestivalFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [paramFilter, setParamFilter] = useState(initialParameter);
  const [statusFilter, setStatusFilter] = useState('all');
  const [violationOnly, setViolationOnly] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const allMeasurements = dataService.getAllMeasurements();

  // Distinct options
  const sites = useMemo(
    () => Array.from(new Set(allMeasurements.map((m) => m.site))),
    [allMeasurements]
  );
  const parameters = useMemo(
    () => Array.from(new Set(allMeasurements.map((m) => m.parameter))),
    [allMeasurements]
  );

  const handleReset = () => {
    setSearchQuery('');
    setSiteFilter('all');
    setYearFilter('all');
    setFestivalFilter('all');
    setPhaseFilter('all');
    setParamFilter('all');
    setStatusFilter('all');
    setViolationOnly(false);
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredRecords = useMemo(() => {
    return allMeasurements.filter((m) => {
      if (siteFilter !== 'all' && m.site !== siteFilter) return false;
      if (yearFilter !== 'all' && m.year.toString() !== yearFilter) return false;
      if (festivalFilter !== 'all' && m.festival !== festivalFilter) return false;
      if (phaseFilter !== 'all' && m.phase !== phaseFilter) return false;
      if (paramFilter !== 'all' && m.parameter !== paramFilter) return false;
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (violationOnly && !m.comparison.isViolation) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchSite = m.site.toLowerCase().includes(q) || m.siteAsPrinted.toLowerCase().includes(q);
        const matchParam = m.parameter.toLowerCase().includes(q);
        const matchVal = (m.numericValue?.toString() || '').includes(q) || m.valueAsPrinted.toLowerCase().includes(q);
        const matchYear = m.year.toString().includes(q);
        if (!matchSite && !matchParam && !matchVal && !matchYear) return false;
      }

      return true;
    });
  }, [
    allMeasurements,
    siteFilter,
    yearFilter,
    festivalFilter,
    phaseFilter,
    paramFilter,
    statusFilter,
    violationOnly,
    searchQuery,
  ]);

  // Pagination calculation
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleExportCsv = () => {
    dataService.exportMeasurementsToCsv(
      filteredRecords,
      `ghatwatch_evidence_${siteFilter !== 'all' ? siteFilter.replace(/\s+/g, '_') : 'all'}.csv`
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Filtering Control Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        {/* Top search & export line */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ghat name, printed text, parameter, or value..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Export Filtered CSV ({totalRecords})
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </button>
          </div>
        </div>

        {/* Filter dropdowns row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Site */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Ghat Site</label>
            <select
              value={siteFilter}
              onChange={(e) => { setSiteFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">All 7 Sites</option>
              {sites.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Report Year</label>
            <select
              value={yearFilter}
              onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>

          {/* Festival */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Festival</label>
            <select
              value={festivalFilter}
              onChange={(e) => { setFestivalFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">All Festivals</option>
              <option value="Ganesh">Ganesh</option>
              <option value="Durga">Durga</option>
            </select>
          </div>

          {/* Phase */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Sampling Phase</label>
            <select
              value={phaseFilter}
              onChange={(e) => { setPhaseFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">All Phases</option>
              <option value="pre">Pre-immersion</option>
              <option value="during">During immersion</option>
              <option value="after">Post-immersion</option>
            </select>
          </div>

          {/* Parameter */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Parameter</label>
            <select
              value={paramFilter}
              onChange={(e) => { setParamFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">All 13 Parameters</option>
              {parameters.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="text-[11px] text-slate-500 block mb-1">Measurement Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="valid_numeric">Valid Numeric</option>
              <option value="bdl">BDL (Below Detection Limit)</option>
              <option value="nd">ND (Not Detected)</option>
              <option value="not_sampled">Not Sampled</option>
            </select>
          </div>
        </div>

        {/* Violations checkbox filter */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <label className="flex items-center space-x-2 cursor-pointer select-none text-slate-700">
            <input
              type="checkbox"
              checked={violationOnly}
              onChange={(e) => {
                setViolationOnly(e.target.checked);
                setCurrentPage(1);
              }}
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <span className="font-medium">Show threshold violations only (DO &lt; 5, BOD &gt; 3, pH outside 6.5–8.5)</span>
          </label>

          <span className="text-slate-500 font-mono">
            {filteredRecords.length.toLocaleString()} matching records
          </span>
        </div>
      </div>

      {/* Main Evidence Table (14 Columns) */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Ghat Site</th>
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Festival</th>
                <th className="py-2.5 px-3">Phase</th>
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3 text-right">Parsed Value</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Printed Text</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Threshold Benchmark</th>
                <th className="py-2.5 px-3">Compliance</th>
                <th className="py-2.5 px-3">Source PDF</th>
                <th className="py-2.5 px-3 text-center">Page</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500 text-xs">
                    No evidence records found matching the active search & filter conditions.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      m.comparison.isViolation ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span>{m.site}</span>
                        {m.siteMatchConfidence === 'medium' && (
                          <ConfidenceBadge confidence="medium" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{m.year}</td>
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">{m.festival}</td>
                    <td className="py-2.5 px-3 text-slate-600 capitalize whitespace-nowrap">{m.phase}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">{m.parameter}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-right text-slate-900 whitespace-nowrap">
                      {m.numericValue !== null ? m.numericValue : '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-xs whitespace-nowrap">{m.unit || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 text-xs whitespace-nowrap">
                      "{m.valueAsPrinted}"
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="capitalize text-xs text-slate-700">
                        {m.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {m.comparison.thresholdLabel}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <ComparisonBadge status={m.comparison.status} />
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-600 max-w-xs truncate" title={m.sourceReportTitle}>
                      {m.sourceReportTitle}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-800 whitespace-nowrap">
                      p. {m.sourcePage ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onInspectRecord(m)}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline px-2 py-1 rounded"
                      >
                        Drawer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              Showing {totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords.toLocaleString()} records
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

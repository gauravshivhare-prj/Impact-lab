import { useState, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { PriorityBadge, ConfidenceBadge } from '../components/common/Badge';
import type { GhatPriority } from '../types';

interface GhatPrioritiesPageProps {
  onSelectGhat: (siteName: string) => void;
  onOpenGhatDetail?: (ghat: GhatPriority) => void;
  onNavigateToEvidenceWithSite: (siteName: string) => void;
  language: 'en' | 'hi';
}

export const GhatPrioritiesPage: React.FC<GhatPrioritiesPageProps> = ({
  onSelectGhat,
  onOpenGhatDetail,
  onNavigateToEvidenceWithSite,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [festivalFilter, setFestivalFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortField, setSortField] = useState<'rank' | 'do' | 'bod' | 'samples'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleResetFilters = () => {
    setSearchQuery('');
    setYearFilter('all');
    setFestivalFilter('all');
    setPhaseFilter('all');
    setPriorityFilter('all');
    setSortField('rank');
    setSortOrder('asc');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    yearFilter !== 'all' ||
    festivalFilter !== 'all' ||
    phaseFilter !== 'all' ||
    priorityFilter !== 'all';

  const ghatRankings = useMemo(() => {
    return dataService.getSiteRankings({
      year: yearFilter,
      festival: festivalFilter,
      phase: phaseFilter,
      priority: priorityFilter,
      searchQuery,
    });
  }, [yearFilter, festivalFilter, phaseFilter, priorityFilter, searchQuery]);

  const sortedGhats = useMemo(() => {
    const list = [...ghatRankings];
    list.sort((a, b) => {
      let diff = 0;
      if (sortField === 'rank') diff = a.rank - b.rank;
      else if (sortField === 'do') diff = b.doExceedanceRate - a.doExceedanceRate;
      else if (sortField === 'bod') diff = b.bodExceedanceRate - a.bodExceedanceRate;
      else if (sortField === 'samples') diff = b.validNumericCount - a.validNumericCount;
      return sortOrder === 'asc' ? diff : -diff;
    });
    return list;
  }, [ghatRankings, sortField, sortOrder]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'घाट या जल स्रोत के नाम से खोजें...'
                  : 'Search ghat by name or water body...'
              }
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year */}
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Years (2023–2025)</option>
              <option value="2025">2025 Reports</option>
              <option value="2024">2024 Reports</option>
              <option value="2023">2023 Reports</option>
            </select>

            {/* Festival */}
            <select
              value={festivalFilter}
              onChange={(e) => setFestivalFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Festivals</option>
              <option value="Ganesh">Ganesh Visarjan</option>
              <option value="Durga">Durga Visarjan</option>
            </select>

            {/* Phase */}
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Phases</option>
              <option value="pre">Pre-immersion</option>
              <option value="during">During immersion</option>
              <option value="after">Post-immersion (1 week)</option>
            </select>

            {/* Priority */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="all">All Priority Levels</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="lower">Lower Priority</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-900">{sortedGhats.length}</strong> of 7 Bhopal immersion sites
            {hasActiveFilters && ' (filtered)'}
          </div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort by:</span>
            <button
              onClick={() => {
                if (sortField === 'rank') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('rank'); setSortOrder('asc'); }
              }}
              className={`hover:text-slate-900 ${sortField === 'rank' ? 'font-semibold text-slate-900 underline' : ''}`}
            >
              Priority Rank
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (sortField === 'do') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('do'); setSortOrder('asc'); }
              }}
              className={`hover:text-slate-900 ${sortField === 'do' ? 'font-semibold text-slate-900 underline' : ''}`}
            >
              DO Deficit
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (sortField === 'bod') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                else { setSortField('bod'); setSortOrder('asc'); }
              }}
              className={`hover:text-slate-900 ${sortField === 'bod' ? 'font-semibold text-slate-900 underline' : ''}`}
            >
              BOD Excess
            </button>
          </div>
        </div>
      </div>

      {/* Ghat Cards / List */}
      {sortedGhats.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg border border-slate-200">
          <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No ghats match current filter criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the filters or modifying your search keyword.</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedGhats.map((ghat) => {
            const doStat = ghat.parameterStats['Dissolved oxygen'];
            const bodStat = ghat.parameterStats['BOD'];
            const phStat = ghat.parameterStats['pH'];

            return (
              <div
                key={ghat.site}
                className="bg-white rounded-lg border border-slate-200 p-5 hover:border-slate-300 transition-colors shadow-2xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Rank, Name, Badges, Explanations */}
                  <div className="flex-1 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-400">
                        #{ghat.rank}
                      </span>
                      <h3
                        onClick={() => (onOpenGhatDetail ? onOpenGhatDetail(ghat) : onSelectGhat(ghat.site))}
                        className="text-base font-semibold text-slate-900 hover:text-teal-700 cursor-pointer transition-colors inline-flex items-center gap-1.5"
                        title={language === 'hi' ? 'मानचित्र व विवरण खोलें' : 'Open details and map'}
                      >
                        <span>{ghat.site}</span>
                        <MapPin className="w-3.5 h-3.5 text-teal-600" />
                      </h3>
                      <span className="text-xs text-slate-500 font-normal">
                        ({ghat.waterBody})
                      </span>
                      <PriorityBadge priority={ghat.priority} />
                      <ConfidenceBadge confidence={ghat.confidence} />
                      {ghat.durga2025Missing && (
                        <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                          Durga 2025 Table Missing
                        </span>
                      )}
                    </div>

                    {/* Primary Finding */}
                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      {ghat.primaryReason}
                    </p>

                    {/* Secondary Explanations */}
                    {ghat.secondaryReasons.length > 0 && (
                      <ul className="text-xs text-slate-500 list-disc list-inside space-y-0.5 pt-0.5">
                        {ghat.secondaryReasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                      <span>
                        Valid Readings: <strong className="font-mono text-slate-800">{ghat.validNumericCount}</strong> / {ghat.totalRecords}
                      </span>
                      <span>·</span>
                      <span>
                        Years Evaluated: <span className="font-mono">{ghat.yearsCovered.join(', ')}</span>
                      </span>
                      {ghat.zeroDOCount > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-rose-700 font-medium">
                            Zero DO (0 mg/l) Events: {ghat.zeroDOCount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Key Parameter Stats */}
                  <div className="lg:w-80 bg-slate-50 p-3.5 rounded border border-slate-200 space-y-3 flex-shrink-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex justify-between">
                      <span>Parameter Benchmark Compliance</span>
                      <span className="text-[11px] text-slate-400">CPCB Class B</span>
                    </div>

                    {/* Dissolved Oxygen */}
                    <div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">Dissolved Oxygen (&ge; 5.0)</span>
                        <span className={`font-mono font-semibold ${
                          ghat.doExceedanceRate > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}>
                          {ghat.doExceedanceRate}% Deficit
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full ${ghat.doExceedanceRate > 50 ? 'bg-rose-600' : ghat.doExceedanceRate > 0 ? 'bg-rose-400' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, ghat.doExceedanceRate)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between font-mono">
                        <span>Min: {doStat?.min ?? '—'} mg/l</span>
                        <span>Avg: {doStat?.avg ?? '—'} mg/l</span>
                      </div>
                    </div>

                    {/* BOD */}
                    <div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600">BOD (&le; 3.0 mg/l)</span>
                        <span className={`font-mono font-semibold ${
                          ghat.bodExceedanceRate > 50 ? 'text-amber-700' : 'text-slate-700'
                        }`}>
                          {ghat.bodExceedanceRate}% Exceed
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${Math.min(100, ghat.bodExceedanceRate)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex justify-between font-mono">
                        <span>Max: {bodStat?.max ?? '—'} mg/l</span>
                        <span>Avg: {bodStat?.avg ?? '—'} mg/l</span>
                      </div>
                    </div>

                    {/* pH */}
                    <div className="pt-1 border-t border-slate-200 flex justify-between text-xs text-slate-600">
                      <span>pH (6.5–8.5 range):</span>
                      <span className="font-mono">
                        {phStat && phStat.exceedanceCount > 0 ? (
                          <span className="text-amber-700 font-semibold">{phStat.exceedanceCount} excursions</span>
                        ) : (
                          <span className="text-emerald-700">100% compliant</span>
                        )}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => (onOpenGhatDetail ? onOpenGhatDetail(ghat) : onSelectGhat(ghat.site))}
                        className="flex-1 text-center text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 py-1.5 px-3 rounded-md transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'विवरण व मानचित्र' : 'Details & Map'}</span>
                      </button>
                      <button
                        onClick={() => onSelectGhat(ghat.site)}
                        className="text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 py-1.5 px-2.5 rounded-md transition-colors"
                        title={language === 'hi' ? 'जल गुणवत्ता रुझान' : 'Water quality trends'}
                      >
                        {language === 'hi' ? 'गुणवत्ता' : 'Trends'}
                      </button>
                      <button
                        onClick={() => onNavigateToEvidenceWithSite(ghat.site)}
                        className="text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 py-1.5 px-2 rounded-md transition-colors"
                        title="View evidence records"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

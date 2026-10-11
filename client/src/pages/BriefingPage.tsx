import { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { briefingService } from '../services/briefingService';
import { dataService } from '../services/dataService';
import type { BriefingResult, BriefingRequest } from '../types';
import { PriorityBadge } from '../components/common/Badge';

interface BriefingPageProps {
  language: 'en' | 'hi';
}

export const BriefingPage: React.FC<BriefingPageProps> = ({ language }) => {
  const allRankings = dataService.getSiteRankings();

  // Configuration form state
  const [briefingLang, setBriefingLang] = useState<'both' | 'en' | 'hi'>(
    language === 'hi' ? 'hi' : 'both'
  );
  const [selectedSites, setSelectedSites] = useState<string[]>(allRankings.map((r) => r.site));
  const [includeSources, setIncludeSources] = useState(true);
  const [includeCaveats, setIncludeCaveats] = useState(true);

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [briefingResult, setBriefingResult] = useState<BriefingResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate initial briefing on mount
  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const request: BriefingRequest = {
        language: briefingLang,
        year: '2023–2025',
        festival: 'all',
        selectedSites,
        includeSourceReferences: includeSources,
        includeDataQualityCaveats: includeCaveats,
      };
      const result = await briefingService.generateBriefing(request);
      setBriefingResult(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    if (!briefingResult) return;

    let text = `BHOPAL MUNICIPAL CORPORATION - VISARJAN WATER QUALITY OPERATIONAL BRIEFING
Report Date: ${briefingResult.generatedAt}
Period: ${briefingResult.reportingPeriod}

--------------------------------------------------------------------------------
EXECUTIVE SUMMARY (ENGLISH)
--------------------------------------------------------------------------------
${briefingResult.executiveSummaryEn}

--------------------------------------------------------------------------------
कार्यकारी सारांश (हिन्दी)
--------------------------------------------------------------------------------
${briefingResult.executiveSummaryHi}

--------------------------------------------------------------------------------
SITE ACTION AND PRIORITIZATION
--------------------------------------------------------------------------------\n`;

    briefingResult.ghats.forEach((g) => {
      text += `[#${g.rank}] ${g.site} (${g.waterBody}) - Priority: ${g.priority.toUpperCase()}
Findings (EN): ${g.reasonEn}
कारण (HI): ${g.reasonHi}
Municipal Action (EN): ${g.recommendedActionEn}
कार्यवाही (HI): ${g.recommendedActionHi}
Measurements: ${g.statsSummary}\n\n`;
    });

    if (includeCaveats) {
      text += `--------------------------------------------------------------------------------
DATA INTEGRITY CAVEATS
--------------------------------------------------------------------------------
${briefingResult.dataQualityCaveatEn}
${briefingResult.dataQualityCaveatHi}\n\n`;
    }

    text += `--------------------------------------------------------------------------------
STATUTORY & LEGAL DISCLAIMER
--------------------------------------------------------------------------------
${briefingResult.statutoryNoticeEn}
${briefingResult.statutoryNoticeHi}\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleAllSites = () => {
    if (selectedSites.length === allRankings.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(allRankings.map((r) => r.site));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Configuration Header Panel (Hidden during Print) */}
      <div className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200 space-y-4 no-print shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Operational Briefing Configuration
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft official decision briefings for Bhopal Municipal Corporation operational officers.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={generateReport}
              disabled={isLoading}
              className="inline-flex items-center text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 px-3.5 py-1.5 rounded transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Update Briefing
                </>
              )}
            </button>
          </div>
        </div>

        {/* Form controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Language Selection */}
          <div>
            <label className="font-medium text-slate-700 block mb-1.5">
              Language Format
            </label>
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200">
              <button
                onClick={() => setBriefingLang('both')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
                  briefingLang === 'both' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Bilingual (Both)
              </button>
              <button
                onClick={() => setBriefingLang('en')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
                  briefingLang === 'en' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setBriefingLang('hi')}
                className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
                  briefingLang === 'hi' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>

          {/* Site selection */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-slate-700">
                Included Immersion Sites ({selectedSites.length}/{allRankings.length})
              </label>
              <button
                onClick={toggleAllSites}
                className="text-[11px] text-teal-700 hover:underline"
              >
                {selectedSites.length === allRankings.length ? 'Deselect All' : 'Select All 7'}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allRankings.map((r) => {
                const isSelected = selectedSites.includes(r.site);
                return (
                  <button
                    key={r.site}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSites(selectedSites.filter((s) => s !== r.site));
                      } else {
                        setSelectedSites([...selectedSites, r.site]);
                      }
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${
                      isSelected
                        ? 'bg-slate-800 text-white border-slate-800 font-medium'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {r.site.split(' ')[0]}...
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100 text-xs text-slate-700">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSources}
              onChange={(e) => setIncludeSources(e.target.checked)}
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <span>Include official PDF citations and page numbers</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCaveats}
              onChange={(e) => setIncludeCaveats(e.target.checked)}
              className="rounded border-slate-300 text-teal-700 focus:ring-teal-600"
            />
            <span>Include data-quality audit caveats (Recommended)</span>
          </label>
        </div>
      </div>

      {/* Briefing Action Toolbar (Top of Document) */}
      {briefingResult && (
        <div className="flex items-center justify-between no-print px-1">
          <div className="text-xs text-slate-500">
            Document generated: <strong className="text-slate-800">{briefingResult.generatedAt}</strong>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Copied Text
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Copy Briefing Text
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Print Official Briefing
            </button>
          </div>
        </div>
      )}

      {/* Official Document-Style Document Paper */}
      {briefingResult && (
        <div className="bg-white border border-slate-300 rounded-lg p-6 sm:p-10 shadow-sm space-y-8 text-slate-900 print:border-none print:shadow-none print:p-0">
          {/* Document Letterhead */}
          <div className="border-b-2 border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-slate-600">
                Bhopal Municipal Corporation · Environmental Decision Support
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Visarjan Ghat Operational Action Advisory
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Historical Water Quality Analysis &amp; Intervention Protocols (2023–2025)
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono">
              <div>Ref: BMC/GW/2026-OP</div>
              <div>Date: {briefingResult.generatedAt}</div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              1. Executive Operational Summary
            </h2>

            {(briefingLang === 'both' || briefingLang === 'en') && (
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wide text-teal-800">
                  English Summary:
                </span>
                {briefingResult.executiveSummaryEn}
              </div>
            )}

            {(briefingLang === 'both' || briefingLang === 'hi') && (
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wide text-teal-800">
                  कार्यकारी सारांश (हिन्दी):
                </span>
                {briefingResult.executiveSummaryHi}
              </div>
            )}
          </div>

          {/* Priority Sites & Recommended Action Items */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              2. Priority Site Findings &amp; Municipal Directives
            </h2>

            <div className="space-y-4">
              {briefingResult.ghats.map((g) => (
                <div
                  key={g.site}
                  className="p-4 border border-slate-200 rounded-md bg-white print-break-inside-avoid space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{g.rank}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900">
                        {g.site}
                      </h3>
                      <span className="text-xs text-slate-500">
                        ({g.waterBody})
                      </span>
                    </div>
                    <PriorityBadge priority={g.priority} />
                  </div>

                  {/* Findings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {(briefingLang === 'both' || briefingLang === 'en') && (
                      <div className="space-y-1">
                        <strong className="text-slate-900 block">Historical Evidence:</strong>
                        <p className="text-slate-700 leading-relaxed">{g.reasonEn}</p>
                      </div>
                    )}
                    {(briefingLang === 'both' || briefingLang === 'hi') && (
                      <div className="space-y-1">
                        <strong className="text-slate-900 block">ऐतिहासिक साक्ष्य:</strong>
                        <p className="text-slate-700 leading-relaxed">{g.reasonHi}</p>
                      </div>
                    )}
                  </div>

                  {/* Recommended Action */}
                  <div className="p-3 bg-teal-50/50 border border-teal-100 rounded text-xs space-y-1">
                    <strong className="text-teal-900 block uppercase tracking-wider text-[11px]">
                      Recommended Operational Action:
                    </strong>
                    {(briefingLang === 'both' || briefingLang === 'en') && (
                      <p className="text-teal-950 font-medium">{g.recommendedActionEn}</p>
                    )}
                    {(briefingLang === 'both' || briefingLang === 'hi') && (
                      <p className="text-teal-950 font-medium pt-1 border-t border-teal-100/60">
                        {g.recommendedActionHi}
                      </p>
                    )}
                  </div>

                  {/* Source citations */}
                  {includeSources && g.sources.length > 0 && (
                    <div className="text-[11px] text-slate-500 pt-1 flex flex-wrap gap-x-3">
                      <span>Source Pages:</span>
                      {g.sources.map((s, idx) => (
                        <span key={idx} className="font-mono">
                          {s.title.split(' ')[4] || 'Report'}: p. {s.page ?? 'N/A'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Integrity Caveats */}
          {includeCaveats && (
            <div className="space-y-3 print-break-inside-avoid">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                3. Data Integrity &amp; Coverage Caveats
              </h2>
              {(briefingLang === 'both' || briefingLang === 'en') && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                  {briefingResult.dataQualityCaveatEn}
                </div>
              )}
              {(briefingLang === 'both' || briefingLang === 'hi') && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed">
                  {briefingResult.dataQualityCaveatHi}
                </div>
              )}
            </div>
          )}

          {/* Statutory & Legal Disclaimer */}
          <div className="space-y-3 pt-2 print-break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              4. Statutory Mandate &amp; NGT Directives
            </h2>
            {(briefingLang === 'both' || briefingLang === 'en') && (
              <div className="text-xs text-slate-600 leading-relaxed">
                {briefingResult.statutoryNoticeEn}
              </div>
            )}
            {(briefingLang === 'both' || briefingLang === 'hi') && (
              <div className="text-xs text-slate-600 leading-relaxed">
                {briefingResult.statutoryNoticeHi}
              </div>
            )}
          </div>

          {/* Source References */}
          {includeSources && (
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1.5 print-break-inside-avoid">
              <div className="font-semibold text-slate-700">Official Document References:</div>
              <ul className="list-disc list-inside space-y-1">
                {briefingResult.sourceReferences.map((ref, idx) => (
                  <li key={idx}>
                    <strong className="text-slate-800">{ref.title}</strong> — {ref.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

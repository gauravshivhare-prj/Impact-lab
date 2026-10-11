import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, AlertCircle, FileText } from 'lucide-react';
import type { Measurement } from '../../types';
import { ComparisonBadge, ConfidenceBadge } from '../common/Badge';

interface EvidenceDrawerProps {
  measurement: Measurement | null;
  onClose: () => void;
  language: 'en' | 'hi';
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  measurement,
  onClose,
  language,
}) => {
  const [copied, setCopied] = useState(false);

  if (!measurement) return null;

  const handleCopySummary = () => {
    const summaryText = `[GhatWatch Evidence]
Site: ${measurement.site} (Printed: "${measurement.siteAsPrinted}")
Water Body: ${measurement.waterBody}
Year: ${measurement.year} | Festival: ${measurement.festival} | Phase: ${measurement.phase}
Parameter: ${measurement.parameter}
Parsed Value: ${measurement.numericValue !== null ? `${measurement.numericValue} ${measurement.unit}` : 'Non-numeric'}
Printed in Report: "${measurement.valueAsPrinted}" (Flag: ${measurement.flag || 'None'})
Threshold Status: ${measurement.comparison.thresholdLabel} - ${measurement.comparison.message}
Source: ${measurement.sourceReportTitle}, Page ${measurement.sourcePage ?? 'N/A'}
Report URL: ${measurement.sourceReportUrl}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {language === 'hi' ? 'परीक्षण साक्ष्य रिकॉर्ड' : 'Historical Test Evidence'}
              </div>
              <h2 className="text-base font-semibold text-slate-900 mt-0.5">
                {measurement.parameter} · {measurement.site}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
            {/* Threshold Evaluation Status */}
            <div className={`p-4 rounded border ${
              measurement.comparison.isViolation
                ? 'bg-rose-50/70 border-rose-200'
                : measurement.comparison.status === 'pass'
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Threshold Evaluation
                </span>
                <ComparisonBadge status={measurement.comparison.status} />
              </div>
              <div className="font-medium text-slate-900">
                {measurement.comparison.message}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Standard: <span className="font-mono">{measurement.comparison.thresholdLabel}</span>
              </div>
            </div>

            {/* Core Measurement Values */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Measurement Record Details
              </h3>
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Parsed Value</div>
                  <div className="text-base font-semibold font-mono text-slate-900 mt-0.5">
                    {measurement.numericValue !== null ? `${measurement.numericValue} ${measurement.unit}` : 'None'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Printed In Report</div>
                  <div className="text-base font-mono text-slate-900 mt-0.5">
                    "{measurement.valueAsPrinted}"
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Measurement Status</div>
                  <div className="font-medium text-slate-800 capitalize mt-0.5">
                    {measurement.status.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Report Flag</div>
                  <div className="font-mono text-slate-800 mt-0.5">
                    {measurement.flag || 'None'}
                  </div>
                </div>
              </div>
            </div>

            {/* Immersion Context */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Sampling Context
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Standardized Site</span>
                  <span className="font-medium text-slate-900 text-right">{measurement.site}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Water Body</span>
                  <span className="text-slate-800 text-right">{measurement.waterBody}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Reported Site Name</span>
                  <span className="text-slate-800 font-mono text-xs text-right max-w-xs">{measurement.siteAsPrinted}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-slate-500">Mapping Confidence</span>
                  <ConfidenceBadge confidence={measurement.siteMatchConfidence} />
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Festival & Year</span>
                  <span className="font-medium text-slate-900">{measurement.festival} {measurement.year}</span>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="text-slate-500">Sampling Phase</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {measurement.phase} immersion
                  </span>
                </div>
              </div>
            </div>

            {/* Official Report Citation */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                Official Report Source
              </h3>
              <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 font-medium">
                    <FileText className="w-4 h-4 text-teal-700 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{measurement.sourceReportTitle}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
                  <span>Page in Official PDF: <strong className="font-mono text-slate-900">Page {measurement.sourcePage ?? 'Unspecified'}</strong></span>
                </div>
                {measurement.sourceReportUrl && (
                  <div className="pt-2 border-t border-slate-200">
                    <a
                      href={measurement.sourceReportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs font-medium text-teal-700 hover:text-teal-800 hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      Open Official MPPCB Report PDF
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Caveats if applicable */}
            {measurement.siteMatchConfidence === 'medium' && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded text-xs text-amber-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Location Mapping Warning:</strong> In official records, Ganesh tables report "Kamla Park kund" while Durga tables report "Lower Lake ghat". Field physical demarcation should confirm exact immersion points.
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Copied Summary
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Copy Evidence Citation
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

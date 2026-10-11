import {
  BookOpen,
  Scale,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { THRESHOLD_RULES } from '../services/thresholdRules';
import { dataService } from '../services/dataService';

interface MethodologyPageProps {
  language?: 'en' | 'hi';
}

export const MethodologyPage: React.FC<MethodologyPageProps> = () => {
  const sources = dataService.getOfficialSources();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Intro */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Operational Technical Documentation</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Methodology &amp; Regulatory Analytical Framework
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          GhatWatch is an empirical decision-support system designed for the Bhopal Municipal Corporation (BMC). It aggregates historical water quality test tables published by the Madhya Pradesh Pollution Control Board (MPPCB) during Ganesh and Durga Visarjan festivals between 2023 and 2025. It applies deterministic, auditable rules to identify locations warranting pre-visarjan intervention.
        </p>
      </div>

      {/* 1. Official Data Sources & Provenance */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-base border-b border-slate-100 pb-2">
          <Scale className="w-4 h-4 text-teal-700" />
          <span>1. Official Data Provenance</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The underlying dataset (<code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">bhopal_ghats_2023_2025.csv</code>) contains 1,524 rows representing testing at 7 standardized immersion sites across 3 sampling phases (pre-immersion, during immersion, and 1 week post-immersion).
        </p>

        <div className="space-y-2.5 pt-1">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Primary Document Repositories:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {Object.entries(sources.reports).map(([yr, rep]) => (
              <div key={yr} className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between">
                <div>
                  <strong className="text-slate-900 block font-semibold">{rep.title}</strong>
                  <span className="text-slate-500 text-[11px] mt-0.5 block">{rep.totalPages} Pages · Published {rep.date}</span>
                </div>
                <a
                  href={rep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-teal-700 hover:underline font-medium text-[11px]"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Download MPPCB PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Deterministic Prioritization Rules */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-base border-b border-slate-100 pb-2">
          <Calculator className="w-4 h-4 text-teal-700" />
          <span>2. Deterministic Prioritization Formula</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          GhatWatch does <strong>not</strong> employ opaque machine learning or unvalidated predictive risk models. Site prioritization is computed directly from 5 transparent, explainable empirical factors:
        </p>

        <div className="border border-slate-200 rounded divide-y divide-slate-100 text-xs">
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <strong className="text-slate-900 block font-semibold">1. Zero Dissolved Oxygen Anoxia Penalty (+30 pts / event)</strong>
              <p className="text-slate-600 mt-0.5">
                Dissolved oxygen recorded at 0.0 mg/l constitutes complete biological collapse (inability to sustain fish life). Bairagarh recorded this 4 times.
              </p>
            </div>
            <span className="font-mono text-rose-700 font-bold whitespace-nowrap">Penalty: 30 &times; Count</span>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="text-slate-900 block font-semibold">2. Dissolved Oxygen Deficit Weight (40% of failure rate)</strong>
              <p className="text-slate-600 mt-0.5">
                Percentage of valid DO samples falling below the CPCB 5.0 mg/l bathing threshold.
              </p>
            </div>
            <span className="font-mono text-slate-800 font-semibold whitespace-nowrap">Score: Rate &times; 0.4</span>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <strong className="text-slate-900 block font-semibold">3. BOD Excess Weight (20% of exceedance rate)</strong>
              <p className="text-slate-600 mt-0.5">
                Percentage of valid BOD samples exceeding the 3.0 mg/l organic waste ceiling.
              </p>
            </div>
            <span className="font-mono text-slate-800 font-semibold whitespace-nowrap">Score: Rate &times; 0.2</span>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong className="text-slate-900 block font-semibold">4. Data Coverage Gap Adjustment (+15 pts)</strong>
              <p className="text-slate-600 mt-0.5">
                Assigned if official monitoring tables omit post-visarjan data (e.g. absent Durga 2025 tables for Bairagarh and Malikhedi).
              </p>
            </div>
            <span className="font-mono text-amber-800 font-semibold whitespace-nowrap">+15 Adjustment</span>
          </div>

          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <strong className="text-slate-900 block font-semibold">5. Site Naming Ambiguity Adjustment (+10 pts)</strong>
              <p className="text-slate-600 mt-0.5">
                Applied to sites where printed names diverge across reports (e.g. Rani Kamlapati ghat vs Kamla Park kund) indicating potential conflation.
              </p>
            </div>
            <span className="font-mono text-amber-800 font-semibold whitespace-nowrap">+10 Adjustment</span>
          </div>
        </div>
      </div>

      {/* 3. Water Quality Threshold Standards */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-base border-b border-slate-100 pb-2">
          <ShieldCheck className="w-4 h-4 text-teal-700" />
          <span>3. CPCB Class B Bathing Water Criteria</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Initial compliance benchmarks adopt the official <strong>Central Pollution Control Board (CPCB) Class B Criteria for Outdoor Bathing (Organised)</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {Object.values(THRESHOLD_RULES).map((rule) => (
            <div key={rule.parameter} className="p-3.5 border border-slate-200 rounded bg-slate-50">
              <div className="font-bold text-slate-900 text-sm">{rule.parameter}</div>
              <div className="font-mono font-semibold text-teal-800 mt-1">{rule.conditionDescription}</div>
              <p className="text-slate-600 mt-2 leading-relaxed text-[11px]">{rule.rationale}</p>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-100 rounded text-xs text-slate-600">
          <strong>Important Standard Disclaimer:</strong> CPCB Class B does not establish fixed numeric bathing limits for COD, total solids, suspended solids, turbidity, or heavy metals (Chromium, Lead, Zinc, Copper). Consequently, GhatWatch displays measurements for those 10 parameters honestly as unassessed rather than fabricating unscientific pass/fail limits.
        </div>
      </div>

      {/* 4. Limitations & Boundaries */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center space-x-2 text-rose-800 font-semibold text-base border-b border-slate-100 pb-2">
          <AlertTriangle className="w-4 h-4 text-rose-700" />
          <span>4. Explicit Limitations &amp; Operational Boundaries</span>
        </div>

        <ul className="text-xs sm:text-sm text-slate-700 space-y-2 list-disc list-inside leading-relaxed">
          <li>
            <strong>Historical Records:</strong> Data reflects historical sampling conditions (2023–2025) and cannot certify water quality at the current moment.
          </li>
          <li>
            <strong>Pre-visarjan Field Testing:</strong> Municipal officers must conduct immediate baseline on-site testing prior to festive immersion schedules.
          </li>
          <li>
            <strong>National Green Tribunal (NGT) Directives:</strong> NGT orders strictly prohibit direct idol immersion into Bhopal's Upper and Lower Lake water bodies. Immersion must be redirected into BMC's dedicated artificial immersion kunds.
          </li>
          <li>
            <strong>No Clinical Epidemiology Claims:</strong> Water parameter excursions denote chemical and physical non-compliance; they do not establish specific medical or clinical health claims without formal public health epidemiology data.
          </li>
        </ul>
      </div>
    </div>
  );
};

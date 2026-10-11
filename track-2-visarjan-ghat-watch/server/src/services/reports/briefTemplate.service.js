/**
 * Deterministic English/Hindi brief built only from backend facts.
 * This is the only brief generator: every number in it comes from the facts payload.
 */

import { getBenchmark } from '../../config/benchmarks.js';

const PRIORITY_LABELS = {
  en: {
    higher_historical_concern: 'Higher historical concern',
    moderate_historical_concern: 'Moderate historical concern',
    lower_observed_concern: 'Lower observed historical concern (this does not mean safe)',
    insufficient_data: 'Insufficient data',
  },
  hi: {
    higher_historical_concern: 'उच्च ऐतिहासिक चिंता',
    moderate_historical_concern: 'मध्यम ऐतिहासिक चिंता',
    lower_observed_concern: 'कम देखी गई ऐतिहासिक चिंता (इसका अर्थ सुरक्षित नहीं है)',
    insufficient_data: 'अपर्याप्त डेटा',
  },
};

const PARAMETER_NAMES = {
  en: { pH: 'pH', 'Dissolved oxygen': 'Dissolved oxygen (DO)', BOD: 'BOD' },
  hi: { pH: 'pH', 'Dissolved oxygen': 'घुलित ऑक्सीजन (DO)', BOD: 'BOD' },
};

function formatUnit(value, unit) {
  return unit ? `${value} ${unit}` : `${value}`;
}

function parameterLine(parameter, language) {
  const name = PARAMETER_NAMES[language][parameter.parameter] ?? parameter.parameter;
  const { validSampleCount: valid, exceedanceCount: exceeded, unit } = parameter;

  if (valid === 0) {
    return language === 'hi'
      ? `• ${name}: कोई मान्य रीडिंग उपलब्ध नहीं।`
      : `• ${name}: no valid readings available.`;
  }

  // Thresholds come from the single benchmark configuration (config/benchmarks.js).
  const benchmark = getBenchmark(parameter.parameter);

  if (benchmark?.type === 'min') {
    const limit = formatUnit(benchmark.threshold, benchmark.unit);
    return language === 'hi'
      ? `• ${name}: ${valid} मान्य रीडिंग में से ${exceeded} रीडिंग CPCB कक्षा B मानक (${limit} या अधिक) से कम थीं; सबसे कम रीडिंग ${formatUnit(parameter.lowestReading, unit)}।`
      : `• ${name}: ${exceeded} of ${valid} valid readings were below the CPCB Class B benchmark (${limit} or more); lowest reading ${formatUnit(parameter.lowestReading, unit)}.`;
  }
  if (benchmark?.type === 'max') {
    const limit = formatUnit(benchmark.threshold, benchmark.unit);
    return language === 'hi'
      ? `• ${name}: ${valid} मान्य रीडिंग में से ${exceeded} रीडिंग ${limit} की सीमा से अधिक थीं; सबसे अधिक रीडिंग ${formatUnit(parameter.highestReading, unit)}।`
      : `• ${name}: ${exceeded} of ${valid} valid readings were above the ${limit} limit; highest reading ${formatUnit(parameter.highestReading, unit)}.`;
  }
  if (benchmark?.type === 'range') {
    const range = `${benchmark.min}–${benchmark.max}`;
    return language === 'hi'
      ? `• ${name}: ${valid} मान्य रीडिंग में से ${exceeded} रीडिंग ${range} की सीमा से बाहर थीं।`
      : `• ${name}: ${exceeded} of ${valid} valid readings were outside the ${range} range.`;
  }
  return language === 'hi'
    ? `• ${name}: ${valid} मान्य रीडिंग में से ${exceeded} रीडिंग मानक पर खरी नहीं उतरीं (${parameter.criterion})।`
    : `• ${name}: ${exceeded} of ${valid} valid readings did not meet the benchmark (${parameter.criterion}).`;
}

function missingTablesLine(tables, language) {
  if (tables.length === 0) return null;
  const list = tables.map((t) => `${t.year} ${t.festival}`).join(', ');
  return language === 'hi'
    ? `इन रिपोर्टों में इस घाट की कोई तालिका नहीं है: ${list} — इस अवधि का डेटा उपलब्ध नहीं है; इसे स्वच्छ नहीं माना गया है।`
    : `No table for this ghat in these reports: ${list} — that period is missing, not clean.`;
}

function sourceLine(sources, language) {
  const parts = sources.map((s) =>
    language === 'hi'
      ? `${s.year} ${s.festival} (पृष्ठ ${s.pages.join(', ')})`
      : `${s.year} ${s.festival} (p. ${s.pages.join(', ')})`,
  );
  return language === 'hi'
    ? `स्रोत: MPPCB विसर्जन रिपोर्ट — ${parts.join('; ')}।`
    : `Sources: MPPCB visarjan reports — ${parts.join('; ')}.`;
}

export function renderTemplateBrief(facts, language) {
  const { ghat, observationPeriod: period, environmentalPriority: priority, dataGaps } = facts;
  const label = PRIORITY_LABELS[language][priority.category] ?? priority.category;
  const lines = [];

  if (language === 'hi') {
    lines.push(`${ghat.name} (${ghat.waterBody}) — ऐतिहासिक जल-गुणवत्ता सारांश, ${period.startYear}–${period.endYear}`);
    lines.push(`पर्यावरणीय प्राथमिकता: ${label} (इस डेटासेट के ${priority.totalRanked} घाटों में रैंक ${priority.rank})।`);
    lines.push(...facts.parameters.map((p) => parameterLine(p, 'hi')));
    lines.push(
      `डेटा की कमी: ${dataGaps.missingReadings} रीडिंग के नमूने नहीं लिए गए — इन्हें अनुपलब्ध माना गया है, स्वच्छ नहीं। ${dataGaps.bdlReadings} रीडिंग BDL (पहचान सीमा से नीचे) हैं — बहुत कम, पर शून्य नहीं।`,
    );
    lines.push('कानूनी स्थिति: सत्यापित नहीं। यह रैंकिंग तय नहीं करती कि विसर्जन की अनुमति है या प्रतिबंध।');
    lines.push('उपयोग: विसर्जन से पहले अतिरिक्त वर्तमान जल-परीक्षण कहाँ कराना है, यह तय करने में इस साक्ष्य का उपयोग करें।');
    lines.push('सीमाएँ: 2023–2025 की ऐतिहासिक रीडिंग 2026 की वर्तमान स्थिति नहीं दर्शातीं। रिपोर्ट में इकाइयाँ नहीं छपी थीं; मानक इकाइयाँ मानी गई हैं।');
    if (ghat.siteMatchConfidence.includes('medium')) {
      lines.push('नोट: इस घाट के नाम का मिलान मध्यम विश्वास का है; स्रोत तालिकाएँ एक से अधिक स्थानों का वर्णन कर सकती हैं।');
    }
  } else {
    lines.push(`${ghat.name} (${ghat.waterBody}) — historical water-quality brief, ${period.startYear}–${period.endYear}`);
    lines.push(`Environmental priority: ${label} (rank ${priority.rank} of ${priority.totalRanked} ghats in this dataset).`);
    lines.push(...facts.parameters.map((p) => parameterLine(p, 'en')));
    lines.push(
      `Data gaps: ${dataGaps.missingReadings} readings were not sampled and are treated as missing, not clean. ${dataGaps.bdlReadings} readings were below the detection limit (BDL): very low, but not zero.`,
    );
    lines.push('Legal status: not verified. This ranking does not decide legal permission or prohibition for immersion.');
    lines.push('Use: to help decide where additional current water testing is needed before visarjan.');
    lines.push('Limitations: historical readings from 2023–2025 do not show current (2026) conditions. Units are assumed; the reports print none.');
    if (ghat.siteMatchConfidence.includes('medium')) {
      lines.push('Note: this site name match is medium confidence; the source tables may describe more than one place.');
    }
  }

  const missingTables = missingTablesLine(dataGaps.reportTablesWithoutThisGhat, language);
  if (missingTables) lines.push(missingTables);

  lines.push(sourceLine(facts.sources, language));
  return lines.join('\n');
}

/**
 * Builds the facts-only payload for a ghat brief from the cached analytics.
 * Every value here comes from services/data, services/analytics or config — never from
 * the request.
 */

import { CPCB_CLASS_B, getAllBenchmarkedParameters } from '../../config/benchmarks.js';
import { getLegalStatus } from '../../config/legalStatus.js';
import { getSourceDocument } from '../../config/sources.js';

export const BRIEF_LIMITATIONS = Object.freeze([
  'Historical readings from 2023–2025 do not show current (2026) water conditions.',
  'Units are assumed: the source reports print no units; standard units for each test are used.',
  'Missing (not sampled) readings are excluded from calculations and are never treated as clean.',
  'BDL means below the detection limit: very low, but not zero and not missing.',
  'Environmental priority is not a legal status; legal status is not verified.',
  'CPCB Class B (outdoor bathing) limits are used as comparison benchmarks, not as a legal rule for immersion.',
]);

function round1(value) {
  return Math.round(value * 10) / 10;
}

function buildParameterFacts(evidence) {
  return getAllBenchmarkedParameters().map((parameter) => {
    const summary = evidence.parameterSummaries?.[parameter];
    const benchmark = CPCB_CLASS_B.parameters[parameter];
    const validSampleCount = summary?.validNumericCount ?? 0;

    return {
      parameter,
      unit: benchmark.unit,
      criterion: benchmark.description,
      validSampleCount,
      exceedanceCount: summary?.exceedanceCount ?? 0,
      exceedancePercent:
        validSampleCount > 0 && summary?.exceedanceRate !== null ? round1(summary.exceedanceRate * 100) : null,
      missingCount: summary?.missingCount ?? 0,
      lowestReading: summary?.statistics?.min ?? null,
      highestReading: summary?.statistics?.max ?? null,
    };
  });
}

function buildSourceFacts(observations) {
  const pagesBySource = new Map();
  for (const observation of observations) {
    if (!observation.sourceId) continue;
    if (!pagesBySource.has(observation.sourceId)) pagesBySource.set(observation.sourceId, new Set());
    if (observation.sourcePage) pagesBySource.get(observation.sourceId).add(observation.sourcePage);
  }

  return [...pagesBySource.entries()]
    .map(([sourceId, pages]) => {
      const document = getSourceDocument(sourceId);
      return {
        sourceId,
        title: document?.title ?? sourceId,
        year: document?.year ?? null,
        festival: document?.festival ?? null,
        pages: [...pages].sort((a, b) => Number(a) - Number(b)),
      };
    })
    .sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || String(a.festival).localeCompare(String(b.festival)));
}

/** Returns null when the ghat is unknown. */
export function buildBriefFacts(dataContext, ghatId) {
  const ghat = dataContext.ghats.get(ghatId);
  const evidence = dataContext.ghatEvidence[ghatId];
  const ranking = dataContext.rankingByGhat.get(ghatId);
  if (!ghat || !evidence || !ranking) return null;

  const observations = ghat.observations;
  const missingCount = observations.filter((o) => o.validationStatus === 'missing').length;
  const bdlCount = observations.filter((o) => o.qualifier === 'BDL').length;

  // Report tables (year + festival) that exist in the dataset but contain no rows for this ghat.
  const ghatSourceIds = new Set(observations.map((o) => o.sourceId));
  const allSourceIds = new Set(dataContext.rankingResult.rankings.flatMap((r) => r.sourceIds));
  const tablesWithoutThisGhat = [...allSourceIds]
    .filter((sourceId) => !ghatSourceIds.has(sourceId))
    .map((sourceId) => getSourceDocument(sourceId))
    .filter(Boolean)
    .map((document) => ({ year: document.year, festival: document.festival }))
    .sort((a, b) => a.year - b.year || a.festival.localeCompare(b.festival));

  const limitations = [...BRIEF_LIMITATIONS];
  for (const table of tablesWithoutThisGhat) {
    limitations.push(`The ${table.year} ${table.festival} report has no table for this ghat; that period is missing, not clean.`);
  }
  if (ghat.siteMatchConfidence.includes('medium')) {
    limitations.push(
      'The site name match is medium confidence: the source tables may describe more than one place under this name.',
    );
  }

  return {
    ghat: {
      ghatId,
      name: ghat.name,
      waterBody: ghat.waterBodies.join('; '),
      siteMatchConfidence: ghat.siteMatchConfidence.join(', '),
    },
    observationPeriod: { startYear: evidence.startYear, endYear: evidence.endYear },
    environmentalPriority: {
      category: ranking.priority,
      rank: ranking.rank,
      totalRanked: dataContext.rankingResult.rankings.length,
      explanation: ranking.explanation,
    },
    legalStatus: getLegalStatus(ghatId).status,
    benchmark: CPCB_CLASS_B.name,
    parameters: buildParameterFacts(evidence),
    dataGaps: {
      totalReadings: observations.length,
      missingReadings: missingCount,
      bdlReadings: bdlCount,
      reportTablesWithoutThisGhat: tablesWithoutThisGhat,
    },
    sources: buildSourceFacts(observations),
    limitations,
  };
}

/** Flattens facts into the `factsUsed` list returned to the client for traceability. */
export function toFactsUsed(facts) {
  const list = [
    { id: 'ghat.name', label: 'Ghat', value: facts.ghat.name },
    { id: 'observationPeriod', label: 'Observation period', value: `${facts.observationPeriod.startYear}-${facts.observationPeriod.endYear}` },
    { id: 'environmentalPriority.category', label: 'Environmental priority', value: facts.environmentalPriority.category },
    { id: 'environmentalPriority.rank', label: 'Rank', value: `${facts.environmentalPriority.rank} of ${facts.environmentalPriority.totalRanked}` },
    { id: 'legalStatus', label: 'Legal status', value: facts.legalStatus },
  ];

  for (const parameter of facts.parameters) {
    list.push({
      id: `parameters.${parameter.parameter}`,
      label: parameter.parameter,
      value: `${parameter.exceedanceCount} of ${parameter.validSampleCount} valid readings did not meet: ${parameter.criterion}`,
      lowestReading: parameter.lowestReading,
      highestReading: parameter.highestReading,
      unit: parameter.unit,
    });
  }

  list.push(
    { id: 'dataGaps.missingReadings', label: 'Missing (not sampled) readings', value: facts.dataGaps.missingReadings },
    { id: 'dataGaps.bdlReadings', label: 'Below detection limit (BDL) readings', value: facts.dataGaps.bdlReadings },
  );

  for (const source of facts.sources) {
    list.push({ id: `sources.${source.sourceId}`, label: source.title, value: `pages ${source.pages.join(', ')}` });
  }

  return list;
}

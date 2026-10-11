/**
 * Read-only application data context.
 *
 * Persistence mode: validated in-memory dataset (docs/ARCHITECTURE.md "Persistence").
 * The committed CSV is imported once at startup using the data/analytics services and
 * the results are cached, so requests never re-parse the CSV. This is not MongoDB
 * persistence and is not presented as such.
 *
 * All calculations come from services/data and services/analytics; this module only
 * indexes their output for the API layer.
 */

import { loadBhopalDataset } from './data/loadDataset.js';
import { aggregateAllGhats, aggregateParameterEvidence, generateDatasetSummary } from './analytics/evidence.service.js';
import { rankAllGhats } from './analytics/ranking.service.js';
import { checkBenchmark, getAllBenchmarkedParameters, hasBenchmark } from '../config/benchmarks.js';

function toPublicObservation(record) {
  const benchmark =
    hasBenchmark(record.parameter) && record.validationStatus === 'valid'
      ? checkBenchmark(record.parameter, record.numericValue)
      : null;

  return {
    observationId: record.observationId,
    ghatId: record.ghatId,
    year: record.yearNumeric,
    festival: record.festival,
    phase: record.phase,
    // The source reports give no sampling dates, only the report year/festival/phase.
    observedAt: null,
    parameter: record.parameter,
    rawValue: record.valueAsPrinted,
    numericValue: record.numericValue,
    qualifier: record.qualifier,
    unit: record.unitAssumed,
    unitIsAssumed: true,
    sourceId: record.sourceId,
    sourcePage: record.sourcePage,
    validationStatus: record.validationStatus,
    parameterAsPrinted: record.parameterAsPrinted,
    siteAsPrinted: record.siteAsPrinted,
    siteMatchConfidence: record.siteMatchConfidence,
    benchmark: benchmark?.applicable
      ? { criterion: benchmark.benchmark, exceedance: benchmark.exceedance }
      : null,
  };
}

function buildGhatIndex(records) {
  const ghats = new Map();

  for (const record of records) {
    if (!record.ghatId) continue;
    if (!ghats.has(record.ghatId)) {
      ghats.set(record.ghatId, {
        ghatId: record.ghatId,
        name: record.site,
        waterBodies: new Set(),
        aliases: new Set(),
        siteMatchConfidence: new Set(),
        observations: [],
      });
    }
    const ghat = ghats.get(record.ghatId);
    if (record.waterBody) ghat.waterBodies.add(record.waterBody);
    if (record.siteAsPrinted) ghat.aliases.add(record.siteAsPrinted);
    if (record.siteMatchConfidence) ghat.siteMatchConfidence.add(record.siteMatchConfidence);
    ghat.observations.push(toPublicObservation(record));
  }

  for (const ghat of ghats.values()) {
    ghat.waterBodies = [...ghat.waterBodies].sort();
    ghat.aliases = [...ghat.aliases].sort();
    ghat.siteMatchConfidence = [...ghat.siteMatchConfidence].sort();
  }

  return ghats;
}

export function buildDataContext({ records, summary }) {
  const rankingResult = rankAllGhats(records);

  // Standard competition ranking: ghats with the same priority and score share a rank (1, 2, 3, 3, 5).
  const rankingByGhat = new Map();
  rankingResult.rankings.forEach((ranking, index) => {
    const previous = index > 0 ? rankingResult.rankings[index - 1] : null;
    const tied = previous && previous.priority === ranking.priority && previous.score === ranking.score;
    const rank = tied ? rankingByGhat.get(previous.ghatId).rank : index + 1;
    rankingByGhat.set(ranking.ghatId, { ...ranking, rank });
  });

  const benchmarkTotals = getAllBenchmarkedParameters().map((parameter) => {
    const evidence = aggregateParameterEvidence(records, parameter);
    return {
      parameter,
      criterion: evidence.benchmarkDescription,
      validSampleCount: evidence.validNumericCount,
      exceedanceCount: evidence.exceedanceCount,
      missingCount: evidence.missingCount,
      qualifiedCount: evidence.qualifiedCount,
      description: evidence.exceedanceDescription,
    };
  });

  return {
    importSummary: summary,
    datasetSummary: generateDatasetSummary(records),
    ghatEvidence: aggregateAllGhats(records),
    rankingResult,
    rankingByGhat,
    benchmarkTotals,
    ghats: buildGhatIndex(records),
  };
}

export async function loadDataContext() {
  const imported = await loadBhopalDataset();
  if (imported.records.length === 0) {
    throw new Error('Dataset import produced no records.');
  }
  return buildDataContext(imported);
}

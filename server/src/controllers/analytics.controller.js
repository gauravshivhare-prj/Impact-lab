import { BENCHMARK_VERSION, CPCB_CLASS_B } from '../config/benchmarks.js';

const SCORE_DESCRIPTION =
  'score = round((1 - weighted exceedance rate) x 100). Lower score means more historical benchmark exceedances. Null when data is insufficient.';

export function getSummary(req, res) {
  const { dataContext } = req.app.locals;
  const { importSummary, datasetSummary, benchmarkTotals, rankingResult } = dataContext;

  res.json({
    data: {
      totalRecords: importSummary.totalRecords,
      ghatCount: datasetSummary.ghatCount,
      parameterCount: datasetSummary.parameterCount,
      parameters: datasetSummary.parameters,
      observationPeriod: datasetSummary.yearRange,
      festivals: importSummary.festivals,
      phases: importSummary.phases,
      validNumericCount: datasetSummary.validNumericCount,
      missingCount: datasetSummary.missingCount,
      bdlCount: datasetSummary.bdlCount,
      ndCount: datasetSummary.ndCount,
      invalidCount: importSummary.invalidCount,
      benchmark: {
        name: CPCB_CLASS_B.name,
        source: CPCB_CLASS_B.source,
        sourceUrl: CPCB_CLASS_B.sourceUrl,
        version: BENCHMARK_VERSION,
      },
      // Exceedance denominators contain valid numeric readings only — missing/BDL/ND are excluded.
      benchmarkResults: benchmarkTotals,
      priorityCounts: rankingResult.categoryCounts,
      limitations: datasetSummary.limitations,
    },
    meta: {},
  });
}

export function getRankings(req, res) {
  const { dataContext } = req.app.locals;
  const { rankingResult, rankingByGhat } = dataContext;

  const data = rankingResult.rankings.map((ranking) => {
    const { rank } = rankingByGhat.get(ranking.ghatId);
    return {
      rank,
      ghatId: ranking.ghatId,
      name: ranking.displayName,
      priority: ranking.priority,
      score: ranking.score,
      explanation: ranking.explanation,
      validSampleCount: ranking.validSampleCount,
      coverage: ranking.coverage,
      observationPeriod: ranking.observationPeriod,
      sourceIds: ranking.sourceIds,
      benchmarkCoverage: ranking.benchmarkCoverage,
      limitations: ranking.limitations,
    };
  });

  res.json({
    data,
    meta: {
      count: data.length,
      scoreDescription: SCORE_DESCRIPTION,
      methodology: rankingResult.methodology,
      categoryCounts: rankingResult.categoryCounts,
      generatedAt: rankingResult.generatedAt,
    },
  });
}

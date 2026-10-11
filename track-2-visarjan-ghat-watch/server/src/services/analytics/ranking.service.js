/**
 * Environmental Priority Ranking Service
 * Implements explainable, deterministic ranking based on historical water quality evidence.
 *
 * IMPORTANT DISCLAIMERS:
 * - Rankings are based on historical data (2023-2025) and do not represent current conditions.
 * - Environmental priority is separate from legal status for idol immersion.
 * - A "lower concern" ranking does NOT mean a site is safe for any particular use.
 * - Rankings should inform monitoring priorities, not replace current water quality assessment.
 */

import { aggregateGhatEvidence, aggregateParameterEvidence } from './evidence.service.js';
import { getAllBenchmarkedParameters, checkBenchmark } from '../../config/benchmarks.js';
import { isValidForCalculation } from '../data/validation.service.js';
import { getGhatDisplayName } from '../data/normalisation.service.js';

export const PRIORITY_CATEGORIES = {
  HIGHER_HISTORICAL_CONCERN: 'higher_historical_concern',
  MODERATE_HISTORICAL_CONCERN: 'moderate_historical_concern',
  LOWER_OBSERVED_CONCERN: 'lower_observed_concern',
  INSUFFICIENT_DATA: 'insufficient_data'
};

export const RANKING_METHODOLOGY = {
  version: '1.0.0',
  description: 'Deterministic historical priority ranking based on CPCB Class B benchmark exceedances',
  benchmarkSource: 'CPCB Water Quality Criteria for Outdoor Bathing (Class B)',
  parameters: ['pH', 'Dissolved oxygen', 'BOD'],
  rules: [
    {
      category: PRIORITY_CATEGORIES.INSUFFICIENT_DATA,
      condition: 'Less than 10 valid numeric observations across all benchmarked parameters, OR no years with complete benchmark coverage'
    },
    {
      category: PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN,
      condition: 'Weighted exceedance rate >= 0.3 (30%) across benchmarked parameters with valid data'
    },
    {
      category: PRIORITY_CATEGORIES.MODERATE_HISTORICAL_CONCERN,
      condition: 'Weighted exceedance rate >= 0.1 (10%) and < 0.3 (30%)'
    },
    {
      category: PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN,
      condition: 'Weighted exceedance rate < 0.1 (10%) with sufficient valid observations'
    }
  ],
  weights: {
    'Dissolved oxygen': 1.5,
    'BOD': 1.5,
    'pH': 1.0
  },
  weightJustification: 'DO and BOD are weighted higher because they directly indicate water quality for aquatic life and organic pollution. pH deviations are less common and often within acceptable ranges.',
  limitations: [
    'Rankings are based on historical 2023-2025 data only.',
    'Does not account for seasonal variation or recent changes.',
    'Cannot predict future water quality.',
    'Environmental priority is not a legal permission for idol immersion.',
    'Lower concern does not mean safe - always verify current conditions.'
  ]
};

export function rankGhat(observations, ghatId) {
  const evidence = aggregateGhatEvidence(observations, ghatId);

  if (evidence.totalRecords === 0) {
    return createRankingResult(ghatId, PRIORITY_CATEGORIES.INSUFFICIENT_DATA, null, evidence, {
      reason: 'No observations found for this ghat.',
      validSampleCount: 0,
      benchmarkCoverage: {}
    });
  }

  const benchmarkedParams = getAllBenchmarkedParameters();
  let totalWeightedExceedances = 0;
  let totalWeightedDenominator = 0;
  const parameterDetails = {};

  for (const param of benchmarkedParams) {
    const paramEvidence = evidence.parameterSummaries[param];

    if (!paramEvidence || paramEvidence.validNumericCount === 0) {
      parameterDetails[param] = {
        validCount: 0,
        exceedanceCount: 0,
        weight: RANKING_METHODOLOGY.weights[param] || 1.0,
        contribution: 0,
        status: 'no_valid_data'
      };
      continue;
    }

    const weight = RANKING_METHODOLOGY.weights[param] || 1.0;
    const weightedExceedances = paramEvidence.exceedanceCount * weight;
    const weightedDenominator = paramEvidence.validNumericCount * weight;

    totalWeightedExceedances += weightedExceedances;
    totalWeightedDenominator += weightedDenominator;

    parameterDetails[param] = {
      validCount: paramEvidence.validNumericCount,
      exceedanceCount: paramEvidence.exceedanceCount,
      exceedanceRate: paramEvidence.exceedanceRate,
      weight,
      weightedExceedances,
      weightedDenominator,
      contribution: weightedExceedances,
      status: 'included'
    };
  }

  const totalValidBenchmarked = Object.values(parameterDetails)
    .reduce((sum, p) => sum + (p.validCount || 0), 0);

  if (totalValidBenchmarked < 10) {
    return createRankingResult(ghatId, PRIORITY_CATEGORIES.INSUFFICIENT_DATA, null, evidence, {
      reason: `Only ${totalValidBenchmarked} valid benchmarked observations (minimum 10 required for ranking).`,
      validSampleCount: totalValidBenchmarked,
      benchmarkCoverage: parameterDetails
    });
  }

  if (totalWeightedDenominator === 0) {
    return createRankingResult(ghatId, PRIORITY_CATEGORIES.INSUFFICIENT_DATA, null, evidence, {
      reason: 'No valid observations for benchmarked parameters.',
      validSampleCount: 0,
      benchmarkCoverage: parameterDetails
    });
  }

  const weightedExceedanceRate = totalWeightedExceedances / totalWeightedDenominator;

  let priority;
  let reason;

  if (weightedExceedanceRate >= 0.3) {
    priority = PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN;
    reason = `Weighted exceedance rate of ${(weightedExceedanceRate * 100).toFixed(1)}% (>= 30%) indicates historically elevated concern for water quality parameters.`;
  } else if (weightedExceedanceRate >= 0.1) {
    priority = PRIORITY_CATEGORIES.MODERATE_HISTORICAL_CONCERN;
    reason = `Weighted exceedance rate of ${(weightedExceedanceRate * 100).toFixed(1)}% (10-30%) indicates moderate historical concern.`;
  } else {
    priority = PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN;
    reason = `Weighted exceedance rate of ${(weightedExceedanceRate * 100).toFixed(1)}% (< 10%) indicates lower observed historical concern. Note: This does NOT mean the site is safe.`;
  }

  const score = Math.round((1 - weightedExceedanceRate) * 100);

  return createRankingResult(ghatId, priority, score, evidence, {
    reason,
    weightedExceedanceRate,
    totalWeightedExceedances,
    totalWeightedDenominator,
    validSampleCount: totalValidBenchmarked,
    benchmarkCoverage: parameterDetails
  });
}

export function rankAllGhats(observations) {
  const ghatIds = new Set(observations.map(o => o.ghatId).filter(Boolean));
  const rankings = [];

  for (const ghatId of ghatIds) {
    rankings.push(rankGhat(observations, ghatId));
  }

  rankings.sort((a, b) => {
    const priorityOrder = {
      [PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN]: 0,
      [PRIORITY_CATEGORIES.MODERATE_HISTORICAL_CONCERN]: 1,
      [PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN]: 2,
      [PRIORITY_CATEGORIES.INSUFFICIENT_DATA]: 3
    };

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    if (a.score !== null && b.score !== null) {
      return a.score - b.score;
    }
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return 0;
  });

  return {
    rankings,
    methodology: RANKING_METHODOLOGY,
    generatedAt: new Date().toISOString(),
    totalGhats: ghatIds.size,
    categoryCounts: {
      [PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN]: rankings.filter(r => r.priority === PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN).length,
      [PRIORITY_CATEGORIES.MODERATE_HISTORICAL_CONCERN]: rankings.filter(r => r.priority === PRIORITY_CATEGORIES.MODERATE_HISTORICAL_CONCERN).length,
      [PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN]: rankings.filter(r => r.priority === PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN).length,
      [PRIORITY_CATEGORIES.INSUFFICIENT_DATA]: rankings.filter(r => r.priority === PRIORITY_CATEGORIES.INSUFFICIENT_DATA).length
    }
  };
}

function createRankingResult(ghatId, priority, score, evidence, details) {
  return {
    ghatId,
    displayName: getGhatDisplayName(ghatId),
    priority,
    score,
    explanation: generateExplanation(ghatId, priority, score, evidence, details),
    validSampleCount: details.validSampleCount,
    coverage: evidence.coverage,
    observationPeriod: evidence.startYear && evidence.endYear
      ? `${evidence.startYear}-${evidence.endYear}`
      : null,
    sourceIds: evidence.sourceIds || [],
    benchmarkCoverage: details.benchmarkCoverage,
    details,
    limitations: [
      'This ranking is based on historical data and does not represent current conditions.',
      'Environmental priority does not determine legal status for idol immersion.',
      'Always verify current water quality before any water-dependent activity.'
    ]
  };
}

function generateExplanation(ghatId, priority, score, evidence, details) {
  const displayName = getGhatDisplayName(ghatId);

  if (priority === PRIORITY_CATEGORIES.INSUFFICIENT_DATA) {
    return `${displayName}: Insufficient data for reliable ranking. ${details.reason}`;
  }

  const yearRange = evidence.startYear && evidence.endYear
    ? `${evidence.startYear}-${evidence.endYear}`
    : 'unknown period';

  let explanation = `${displayName} (${yearRange}): `;

  if (priority === PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN) {
    explanation += `Higher historical environmental concern. `;
  } else if (priority === PRIORITY_CATEGORIES.MODERATE_HISTORICAL_CONCERN) {
    explanation += `Moderate historical environmental concern. `;
  } else {
    explanation += `Lower observed historical concern. `;
  }

  explanation += details.reason;

  const exceedanceDetails = [];
  for (const [param, info] of Object.entries(details.benchmarkCoverage)) {
    if (info.status === 'included' && info.exceedanceCount > 0) {
      exceedanceDetails.push(`${param}: ${info.exceedanceCount}/${info.validCount} exceedances`);
    }
  }

  if (exceedanceDetails.length > 0) {
    explanation += ` Benchmark exceedances: ${exceedanceDetails.join('; ')}.`;
  }

  return explanation;
}

export function getMethodology() {
  return RANKING_METHODOLOGY;
}

export function validateRankingDeterminism(observations) {
  const run1 = rankAllGhats(observations);
  const run2 = rankAllGhats(observations);

  const isDeterministic = run1.rankings.every((r1, i) => {
    const r2 = run2.rankings[i];
    return r1.ghatId === r2.ghatId &&
           r1.priority === r2.priority &&
           r1.score === r2.score;
  });

  return {
    isDeterministic,
    run1Summary: run1.rankings.map(r => ({ ghatId: r.ghatId, priority: r.priority, score: r.score })),
    run2Summary: run2.rankings.map(r => ({ ghatId: r.ghatId, priority: r.priority, score: r.score }))
  };
}

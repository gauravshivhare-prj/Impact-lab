/**
 * Evidence Aggregation Service
 * Calculates deterministic summaries for each ghat and parameter.
 * Handles missing, BDL, and ND values correctly - never treating them as zero or passing.
 */

import { checkBenchmark, hasBenchmark, getAllBenchmarkedParameters, CPCB_CLASS_B } from '../../config/benchmarks.js';
import { isValidForCalculation, isMissing, isBDL, isND, isQualified } from '../data/validation.service.js';
import { getGhatDisplayName, getParameterDisplayName } from '../data/normalisation.service.js';

export function aggregateGhatEvidence(observations, ghatId) {
  const ghatObs = observations.filter(o => o.ghatId === ghatId);

  if (ghatObs.length === 0) {
    return {
      ghatId,
      displayName: getGhatDisplayName(ghatId),
      totalRecords: 0,
      coverage: 'no_data',
      historicalEvidence: createEmptyEvidence(ghatId),
      limitations: ['No observations found for this ghat.']
    };
  }

  const years = new Set(ghatObs.map(o => o.yearNumeric).filter(Boolean));
  const festivals = new Set(ghatObs.map(o => o.festival).filter(Boolean));
  const parameters = new Set(ghatObs.map(o => o.parameter).filter(Boolean));
  const sourceIds = new Set(ghatObs.map(o => o.sourceId).filter(Boolean));

  const parameterSummaries = {};
  for (const param of parameters) {
    parameterSummaries[param] = aggregateParameterEvidence(ghatObs, param);
  }

  const benchmarkedParams = getAllBenchmarkedParameters();
  const exceedanceSummary = [];

  for (const param of benchmarkedParams) {
    if (parameterSummaries[param]) {
      const summary = parameterSummaries[param];
      if (summary.exceedanceCount > 0) {
        exceedanceSummary.push({
          parameter: param,
          exceedanceCount: summary.exceedanceCount,
          validSampleCount: summary.validNumericCount,
          exceedanceRate: summary.exceedanceRate,
          description: summary.exceedanceDescription
        });
      }
    }
  }

  const coverage = calculateCoverage(ghatObs, years.size, parameters.size);
  const limitations = generateLimitations(ghatObs, coverage, years);

  return {
    ghatId,
    displayName: getGhatDisplayName(ghatId),
    totalRecords: ghatObs.length,
    startYear: years.size > 0 ? Math.min(...years) : null,
    endYear: years.size > 0 ? Math.max(...years) : null,
    years: Array.from(years).sort(),
    festivals: Array.from(festivals).sort(),
    parameters: Array.from(parameters).sort(),
    coverage,
    parameterSummaries,
    exceedanceSummary,
    sourceIds: Array.from(sourceIds),
    limitations,
    historicalEvidence: {
      startYear: years.size > 0 ? Math.min(...years) : null,
      endYear: years.size > 0 ? Math.max(...years) : null,
      sampleCount: ghatObs.length,
      coverage,
      exceedances: exceedanceSummary,
      observations: parameterSummaries
    }
  };
}

export function aggregateParameterEvidence(observations, parameter) {
  const paramObs = observations.filter(o => o.parameter === parameter);

  if (paramObs.length === 0) {
    return {
      parameter,
      displayName: getParameterDisplayName(parameter) || parameter,
      totalRecords: 0,
      validNumericCount: 0,
      missingCount: 0,
      bdlCount: 0,
      ndCount: 0,
      invalidCount: 0,
      qualifiedCount: 0,
      exceedanceCount: 0,
      exceedanceRate: null,
      exceedanceDenominator: 0,
      hasBenchmark: hasBenchmark(parameter),
      benchmarkDescription: null,
      exceedanceDescription: 'No observations available.'
    };
  }

  let validNumericCount = 0;
  let missingCount = 0;
  let bdlCount = 0;
  let ndCount = 0;
  let invalidCount = 0;
  let exceedanceCount = 0;
  const numericValues = [];
  const sourcePages = new Set();

  for (const obs of paramObs) {
    if (obs.sourcePage) sourcePages.add(obs.sourcePage);

    if (isValidForCalculation(obs)) {
      validNumericCount++;
      numericValues.push(obs.numericValue);

      if (hasBenchmark(parameter)) {
        const result = checkBenchmark(parameter, obs.numericValue);
        if (result.applicable && result.exceedance) {
          exceedanceCount++;
        }
      }
    } else if (isMissing(obs)) {
      missingCount++;
    } else if (isBDL(obs)) {
      bdlCount++;
    } else if (isND(obs)) {
      ndCount++;
    } else if (obs.validationStatus === 'invalid') {
      invalidCount++;
    }
  }

  const qualifiedCount = bdlCount + ndCount;
  const benchmark = hasBenchmark(parameter) ? CPCB_CLASS_B.parameters[parameter] : null;

  const exceedanceRate = validNumericCount > 0
    ? Math.round((exceedanceCount / validNumericCount) * 1000) / 1000
    : null;

  let exceedanceDescription;
  if (!hasBenchmark(parameter)) {
    exceedanceDescription = `No CPCB bathing benchmark defined for ${parameter}.`;
  } else if (validNumericCount === 0) {
    exceedanceDescription = `No valid numeric observations to compare against benchmark.`;
  } else if (exceedanceCount === 0) {
    exceedanceDescription = `All ${validNumericCount} valid observation(s) met the ${benchmark.description}.`;
  } else {
    exceedanceDescription = `${exceedanceCount} of ${validNumericCount} valid observation(s) (${(exceedanceRate * 100).toFixed(1)}%) exceeded the benchmark (${benchmark.description}).`;
  }

  const stats = numericValues.length > 0 ? {
    min: Math.min(...numericValues),
    max: Math.max(...numericValues),
    mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length
  } : null;

  return {
    parameter,
    displayName: getParameterDisplayName(parameter) || parameter,
    totalRecords: paramObs.length,
    validNumericCount,
    missingCount,
    bdlCount,
    ndCount,
    invalidCount,
    qualifiedCount,
    exceedanceCount,
    exceedanceRate,
    exceedanceDenominator: validNumericCount,
    hasBenchmark: hasBenchmark(parameter),
    benchmarkDescription: benchmark ? benchmark.description : null,
    exceedanceDescription,
    statistics: stats,
    sourcePages: Array.from(sourcePages).sort()
  };
}

export function aggregateAllGhats(observations) {
  const ghatIds = new Set(observations.map(o => o.ghatId).filter(Boolean));
  const results = {};

  for (const ghatId of ghatIds) {
    results[ghatId] = aggregateGhatEvidence(observations, ghatId);
  }

  return results;
}

export function generateDatasetSummary(observations) {
  const ghatIds = new Set(observations.map(o => o.ghatId).filter(Boolean));
  const parameters = new Set(observations.map(o => o.parameter).filter(Boolean));
  const years = new Set(observations.map(o => o.yearNumeric).filter(Boolean));

  let totalValid = 0;
  let totalMissing = 0;
  let totalBDL = 0;
  let totalND = 0;
  let totalInvalid = 0;

  for (const obs of observations) {
    if (isValidForCalculation(obs)) totalValid++;
    else if (isMissing(obs)) totalMissing++;
    else if (isBDL(obs)) totalBDL++;
    else if (isND(obs)) totalND++;
    else if (obs.validationStatus === 'invalid') totalInvalid++;
  }

  const benchmarkedParams = getAllBenchmarkedParameters();
  const benchmarkCoverage = {};

  for (const param of benchmarkedParams) {
    const paramObs = observations.filter(o => o.parameter === param);
    const validCount = paramObs.filter(o => isValidForCalculation(o)).length;
    benchmarkCoverage[param] = {
      totalRecords: paramObs.length,
      validNumericCount: validCount,
      coverage: validCount > 0 ? 'available' : 'no_valid_data'
    };
  }

  return {
    totalRecords: observations.length,
    ghatCount: ghatIds.size,
    ghats: Array.from(ghatIds).sort(),
    parameterCount: parameters.size,
    parameters: Array.from(parameters).sort(),
    yearRange: years.size > 0 ? {
      start: Math.min(...years),
      end: Math.max(...years)
    } : null,
    validNumericCount: totalValid,
    missingCount: totalMissing,
    bdlCount: totalBDL,
    ndCount: totalND,
    invalidCount: totalInvalid,
    benchmarkCoverage,
    limitations: [
      'Historical data from 2023-2025 does not represent current 2026 conditions.',
      'Units are assumed based on standard conventions; original reports did not specify units.',
      'BDL and ND values are preserved as qualified observations, not converted to zero.'
    ]
  };
}

function calculateCoverage(observations, yearCount, parameterCount) {
  const validCount = observations.filter(o => isValidForCalculation(o)).length;
  const totalCount = observations.length;

  if (totalCount === 0) return 'no_data';

  const validRatio = validCount / totalCount;

  if (yearCount >= 3 && parameterCount >= 10 && validRatio >= 0.7) {
    return 'good';
  }
  if (yearCount >= 2 && parameterCount >= 5 && validRatio >= 0.5) {
    return 'moderate';
  }
  if (validCount > 0) {
    return 'limited';
  }
  return 'insufficient_data';
}

function generateLimitations(observations, coverage, years) {
  const limitations = [];

  limitations.push('Historical data does not certify current water conditions.');

  if (coverage === 'limited' || coverage === 'insufficient_data') {
    limitations.push('Limited data coverage may not represent typical conditions.');
  }

  const missingCount = observations.filter(o => isMissing(o)).length;
  const bdlCount = observations.filter(o => isBDL(o)).length;

  if (missingCount > 0) {
    limitations.push(`${missingCount} observation(s) are missing/not sampled and excluded from calculations.`);
  }

  if (bdlCount > 0) {
    limitations.push(`${bdlCount} observation(s) are marked BDL (below detection limit) - values are very low but not zero.`);
  }

  const yearsArray = Array.from(years);
  if (yearsArray.length > 0 && Math.max(...yearsArray) < 2026) {
    limitations.push('Most recent data is from before 2026.');
  }

  return limitations;
}

function createEmptyEvidence(ghatId) {
  return {
    startYear: null,
    endYear: null,
    sampleCount: 0,
    coverage: 'insufficient_data',
    priority: 'insufficient_data',
    exceedances: [],
    observations: []
  };
}

/**
 * Tests for analytics services: evidence aggregation and ranking
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  aggregateGhatEvidence,
  aggregateParameterEvidence,
  generateDatasetSummary
} from './evidence.service.js';

import {
  rankGhat,
  rankAllGhats,
  validateRankingDeterminism,
  PRIORITY_CATEGORIES,
  RANKING_METHODOLOGY,
  getMethodology
} from './ranking.service.js';

import {
  checkBenchmark,
  hasBenchmark,
  getAllBenchmarkedParameters
} from '../../config/benchmarks.js';

function createObservation(overrides = {}) {
  return {
    ghatId: 'khatlapura-ghat',
    site: 'Khatlapura ghat',
    parameter: 'pH',
    year: '2023',
    yearNumeric: 2023,
    festival: 'Ganesh',
    phase: 'pre',
    validationStatus: 'valid',
    numericValue: 7.5,
    qualifier: null,
    sourcePage: '26',
    sourceId: 'mppcb-2023-ganesh',
    ...overrides
  };
}

describe('Benchmark Configuration', () => {
  it('should define benchmarks for pH, DO, and BOD only', () => {
    const params = getAllBenchmarkedParameters();

    assert.deepStrictEqual(params.sort(), ['BOD', 'Dissolved oxygen', 'pH'].sort());
    assert.strictEqual(hasBenchmark('pH'), true);
    assert.strictEqual(hasBenchmark('Dissolved oxygen'), true);
    assert.strictEqual(hasBenchmark('BOD'), true);
    assert.strictEqual(hasBenchmark('Chromium'), false);
    assert.strictEqual(hasBenchmark('COD'), false);
  });

  it('should check pH range correctly (6.5-8.5)', () => {
    assert.strictEqual(checkBenchmark('pH', 7.0).passes, true);
    assert.strictEqual(checkBenchmark('pH', 6.5).passes, true);
    assert.strictEqual(checkBenchmark('pH', 8.5).passes, true);
    assert.strictEqual(checkBenchmark('pH', 6.4).passes, false);
    assert.strictEqual(checkBenchmark('pH', 8.6).passes, false);
  });

  it('should check DO minimum correctly (>= 5 mg/l)', () => {
    assert.strictEqual(checkBenchmark('Dissolved oxygen', 5.0).passes, true);
    assert.strictEqual(checkBenchmark('Dissolved oxygen', 6.0).passes, true);
    assert.strictEqual(checkBenchmark('Dissolved oxygen', 4.9).passes, false);
    assert.strictEqual(checkBenchmark('Dissolved oxygen', 4.9).exceedance, true);
  });

  it('should check BOD maximum correctly (<= 3 mg/l)', () => {
    assert.strictEqual(checkBenchmark('BOD', 3.0).passes, true);
    assert.strictEqual(checkBenchmark('BOD', 2.0).passes, true);
    assert.strictEqual(checkBenchmark('BOD', 3.1).passes, false);
    assert.strictEqual(checkBenchmark('BOD', 3.1).exceedance, true);
  });

  it('should handle null/undefined values as not applicable', () => {
    const result = checkBenchmark('pH', null);
    assert.strictEqual(result.applicable, false);
    assert.strictEqual(result.reason, 'missing_or_invalid_value');
  });

  it('should handle parameters without benchmarks', () => {
    const result = checkBenchmark('Chromium', 0.5);
    assert.strictEqual(result.applicable, false);
    assert.strictEqual(result.reason, 'no_benchmark_defined');
  });
});

describe('Evidence Aggregation Service', () => {
  it('should aggregate parameter evidence correctly', () => {
    const observations = [
      createObservation({ parameter: 'pH', numericValue: 7.0 }),
      createObservation({ parameter: 'pH', numericValue: 7.5 }),
      createObservation({ parameter: 'pH', numericValue: 8.0 })
    ];

    const result = aggregateParameterEvidence(observations, 'pH');

    assert.strictEqual(result.totalRecords, 3);
    assert.strictEqual(result.validNumericCount, 3);
    assert.strictEqual(result.exceedanceCount, 0);
    assert.strictEqual(result.hasBenchmark, true);
  });

  it('should count exceedances correctly', () => {
    const observations = [
      createObservation({ parameter: 'BOD', numericValue: 2.0 }),
      createObservation({ parameter: 'BOD', numericValue: 4.0 }),
      createObservation({ parameter: 'BOD', numericValue: 5.0 })
    ];

    const result = aggregateParameterEvidence(observations, 'BOD');

    assert.strictEqual(result.validNumericCount, 3);
    assert.strictEqual(result.exceedanceCount, 2);
    assert.ok(Math.abs(result.exceedanceRate - (2/3)) < 0.001);
  });

  it('should exclude missing values from denominators', () => {
    const observations = [
      createObservation({ parameter: 'pH', numericValue: 7.0, validationStatus: 'valid' }),
      createObservation({ parameter: 'pH', numericValue: null, validationStatus: 'missing', qualifier: 'missing' }),
      createObservation({ parameter: 'pH', numericValue: null, validationStatus: 'qualified', qualifier: 'BDL' })
    ];

    const result = aggregateParameterEvidence(observations, 'pH');

    assert.strictEqual(result.totalRecords, 3);
    assert.strictEqual(result.validNumericCount, 1);
    assert.strictEqual(result.missingCount, 1);
    assert.strictEqual(result.bdlCount, 1);
    assert.strictEqual(result.exceedanceDenominator, 1);
  });

  it('should aggregate ghat evidence correctly', () => {
    const observations = [
      createObservation({ parameter: 'pH', numericValue: 7.0, yearNumeric: 2023 }),
      createObservation({ parameter: 'BOD', numericValue: 2.5, yearNumeric: 2023 }),
      createObservation({ parameter: 'pH', numericValue: 7.2, yearNumeric: 2024 })
    ];

    const result = aggregateGhatEvidence(observations, 'khatlapura-ghat');

    assert.strictEqual(result.ghatId, 'khatlapura-ghat');
    assert.strictEqual(result.totalRecords, 3);
    assert.deepStrictEqual(result.years, [2023, 2024]);
    assert.ok(result.parameterSummaries['pH']);
    assert.ok(result.parameterSummaries['BOD']);
  });

  it('should handle empty observations for a ghat', () => {
    const observations = [];
    const result = aggregateGhatEvidence(observations, 'unknown-ghat');

    assert.strictEqual(result.totalRecords, 0);
    assert.strictEqual(result.coverage, 'no_data');
    assert.ok(result.limitations.length > 0);
  });

  it('should generate dataset summary correctly', () => {
    const observations = [
      createObservation({ ghatId: 'ghat-1', parameter: 'pH', yearNumeric: 2023 }),
      createObservation({ ghatId: 'ghat-1', parameter: 'BOD', yearNumeric: 2023 }),
      createObservation({ ghatId: 'ghat-2', parameter: 'pH', yearNumeric: 2024 })
    ];

    const summary = generateDatasetSummary(observations);

    assert.strictEqual(summary.totalRecords, 3);
    assert.strictEqual(summary.ghatCount, 2);
    assert.ok(summary.yearRange);
    assert.strictEqual(summary.yearRange.start, 2023);
    assert.strictEqual(summary.yearRange.end, 2024);
  });

  it('should never divide by zero', () => {
    const observations = [
      createObservation({ parameter: 'pH', numericValue: null, validationStatus: 'missing', qualifier: 'missing' })
    ];

    const result = aggregateParameterEvidence(observations, 'pH');

    assert.strictEqual(result.exceedanceRate, null);
    assert.strictEqual(result.validNumericCount, 0);
  });
});

describe('Ranking Service', () => {
  it('should return insufficient_data for empty observations', () => {
    const result = rankGhat([], 'unknown-ghat');

    assert.strictEqual(result.priority, PRIORITY_CATEGORIES.INSUFFICIENT_DATA);
    assert.strictEqual(result.score, null);
  });

  it('should return insufficient_data for fewer than 10 valid benchmarked observations', () => {
    const observations = [
      createObservation({ parameter: 'pH', numericValue: 7.0 }),
      createObservation({ parameter: 'pH', numericValue: 7.1 }),
      createObservation({ parameter: 'pH', numericValue: 7.2 })
    ];

    const result = rankGhat(observations, 'khatlapura-ghat');

    assert.strictEqual(result.priority, PRIORITY_CATEGORIES.INSUFFICIENT_DATA);
    assert.ok(result.explanation.includes('minimum'));
  });

  it('should calculate lower_observed_concern for low exceedance rate', () => {
    const observations = [];
    for (let i = 0; i < 15; i++) {
      observations.push(createObservation({ parameter: 'pH', numericValue: 7.0 }));
      observations.push(createObservation({ parameter: 'Dissolved oxygen', numericValue: 6.0 }));
      observations.push(createObservation({ parameter: 'BOD', numericValue: 2.0 }));
    }

    const result = rankGhat(observations, 'khatlapura-ghat');

    assert.strictEqual(result.priority, PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN);
    assert.ok(result.score !== null);
    assert.ok(result.score >= 90);
  });

  it('should calculate higher_historical_concern for high exceedance rate', () => {
    const observations = [];
    for (let i = 0; i < 15; i++) {
      observations.push(createObservation({ parameter: 'pH', numericValue: 6.0 }));
      observations.push(createObservation({ parameter: 'Dissolved oxygen', numericValue: 3.0 }));
      observations.push(createObservation({ parameter: 'BOD', numericValue: 5.0 }));
    }

    const result = rankGhat(observations, 'khatlapura-ghat');

    assert.strictEqual(result.priority, PRIORITY_CATEGORIES.HIGHER_HISTORICAL_CONCERN);
  });

  it('should be deterministic across multiple runs', () => {
    const observations = [];
    for (let i = 0; i < 20; i++) {
      observations.push(createObservation({
        ghatId: 'ghat-1',
        parameter: 'pH',
        numericValue: 7.0 + (i % 3) * 0.5
      }));
      observations.push(createObservation({
        ghatId: 'ghat-1',
        parameter: 'Dissolved oxygen',
        numericValue: 5.5
      }));
      observations.push(createObservation({
        ghatId: 'ghat-1',
        parameter: 'BOD',
        numericValue: 2.5
      }));
    }

    const validation = validateRankingDeterminism(observations);

    assert.strictEqual(validation.isDeterministic, true);
  });

  it('should rank all ghats and sort by priority', () => {
    const observations = [];

    for (let i = 0; i < 15; i++) {
      observations.push(createObservation({
        ghatId: 'good-ghat',
        parameter: 'pH',
        numericValue: 7.0
      }));
      observations.push(createObservation({
        ghatId: 'good-ghat',
        parameter: 'Dissolved oxygen',
        numericValue: 6.0
      }));
      observations.push(createObservation({
        ghatId: 'good-ghat',
        parameter: 'BOD',
        numericValue: 2.0
      }));

      observations.push(createObservation({
        ghatId: 'bad-ghat',
        parameter: 'pH',
        numericValue: 6.0
      }));
      observations.push(createObservation({
        ghatId: 'bad-ghat',
        parameter: 'Dissolved oxygen',
        numericValue: 3.0
      }));
      observations.push(createObservation({
        ghatId: 'bad-ghat',
        parameter: 'BOD',
        numericValue: 5.0
      }));
    }

    const result = rankAllGhats(observations);

    assert.strictEqual(result.rankings.length, 2);
    assert.strictEqual(result.rankings[0].ghatId, 'bad-ghat');
    assert.strictEqual(result.rankings[1].ghatId, 'good-ghat');
  });

  it('should include methodology documentation', () => {
    const methodology = getMethodology();

    assert.ok(methodology.version);
    assert.ok(methodology.description);
    assert.ok(methodology.benchmarkSource);
    assert.ok(methodology.rules.length > 0);
    assert.ok(methodology.weights);
    assert.ok(methodology.limitations.length > 0);
  });

  it('should include limitations in ranking result', () => {
    const observations = [];
    for (let i = 0; i < 15; i++) {
      observations.push(createObservation({ parameter: 'pH', numericValue: 7.0 }));
    }

    const result = rankGhat(observations, 'khatlapura-ghat');

    assert.ok(result.limitations.length > 0);
    assert.ok(result.limitations.some(l => l.includes('historical')));
  });

  it('should not label any ghat as safe without explicit warning', () => {
    const observations = [];
    for (let i = 0; i < 50; i++) {
      observations.push(createObservation({ parameter: 'pH', numericValue: 7.0 }));
      observations.push(createObservation({ parameter: 'Dissolved oxygen', numericValue: 8.0 }));
      observations.push(createObservation({ parameter: 'BOD', numericValue: 1.0 }));
    }

    const result = rankGhat(observations, 'khatlapura-ghat');

    assert.strictEqual(result.priority, PRIORITY_CATEGORIES.LOWER_OBSERVED_CONCERN);
    assert.ok(result.explanation.includes('NOT'));
    assert.ok(result.limitations.some(l => l.toLowerCase().includes('does not')));
  });

  it('should include valid sample count and coverage', () => {
    const observations = [];
    for (let i = 0; i < 15; i++) {
      observations.push(createObservation({ parameter: 'pH', numericValue: 7.0 }));
      observations.push(createObservation({ parameter: 'Dissolved oxygen', numericValue: 6.0 }));
    }

    const result = rankGhat(observations, 'khatlapura-ghat');

    assert.ok(result.validSampleCount > 0);
    assert.ok(result.coverage);
    assert.ok(result.benchmarkCoverage);
  });
});

describe('Integration: Missing Values in Rankings', () => {
  it('should not count missing values toward exceedances or passes', () => {
    const observations = [];

    for (let i = 0; i < 10; i++) {
      observations.push(createObservation({
        parameter: 'pH',
        numericValue: 7.0,
        validationStatus: 'valid'
      }));
    }

    observations.push(createObservation({
      parameter: 'pH',
      numericValue: null,
      validationStatus: 'missing',
      qualifier: 'missing'
    }));

    observations.push(createObservation({
      parameter: 'Dissolved oxygen',
      numericValue: null,
      validationStatus: 'qualified',
      qualifier: 'BDL'
    }));

    const evidence = aggregateGhatEvidence(observations, 'khatlapura-ghat');
    const phEvidence = evidence.parameterSummaries['pH'];

    assert.strictEqual(phEvidence.validNumericCount, 10);
    assert.strictEqual(phEvidence.totalRecords, 11);
    assert.strictEqual(phEvidence.exceedanceDenominator, 10);
  });
});

/**
 * CPCB Water Quality Criteria for Outdoor Bathing (Class B)
 * Source: Central Pollution Control Board (CPCB)
 * Reference: https://cpcb.gov.in/water-quality-criteria/
 *
 * These are environmental monitoring benchmarks, not legal permission rules for idol immersion.
 */

export const CPCB_CLASS_B = {
  name: 'CPCB Class B - Outdoor Bathing (Organised)',
  source: 'Central Pollution Control Board',
  sourceUrl: 'https://cpcb.gov.in/water-quality-criteria/',
  parameters: {
    pH: {
      type: 'range',
      min: 6.5,
      max: 8.5,
      unit: null,
      description: 'pH must be within 6.5-8.5 range'
    },
    'Dissolved oxygen': {
      type: 'min',
      threshold: 5,
      unit: 'mg/l',
      description: 'Dissolved oxygen must be 5 mg/l or greater'
    },
    BOD: {
      type: 'max',
      threshold: 3,
      unit: 'mg/l',
      description: 'BOD must be 3 mg/l or less'
    }
  }
};

export const BENCHMARK_VERSION = '1.0.0';

export function hasBenchmark(parameter) {
  return parameter in CPCB_CLASS_B.parameters;
}

export function getBenchmark(parameter) {
  return CPCB_CLASS_B.parameters[parameter] || null;
}

export function checkBenchmark(parameter, numericValue) {
  if (numericValue === null || numericValue === undefined || Number.isNaN(numericValue)) {
    return { applicable: false, reason: 'missing_or_invalid_value' };
  }

  const benchmark = getBenchmark(parameter);
  if (!benchmark) {
    return { applicable: false, reason: 'no_benchmark_defined' };
  }

  if (benchmark.type === 'range') {
    const passes = numericValue >= benchmark.min && numericValue <= benchmark.max;
    return {
      applicable: true,
      passes,
      exceedance: !passes,
      benchmark: `${benchmark.min}-${benchmark.max}`,
      reason: passes
        ? `Value ${numericValue} within range ${benchmark.min}-${benchmark.max}`
        : numericValue < benchmark.min
          ? `Value ${numericValue} below minimum ${benchmark.min}`
          : `Value ${numericValue} above maximum ${benchmark.max}`
    };
  }

  if (benchmark.type === 'min') {
    const passes = numericValue >= benchmark.threshold;
    return {
      applicable: true,
      passes,
      exceedance: !passes,
      benchmark: `>= ${benchmark.threshold} ${benchmark.unit}`,
      reason: passes
        ? `Value ${numericValue} meets minimum ${benchmark.threshold}`
        : `Value ${numericValue} below minimum ${benchmark.threshold}`
    };
  }

  if (benchmark.type === 'max') {
    const passes = numericValue <= benchmark.threshold;
    return {
      applicable: true,
      passes,
      exceedance: !passes,
      benchmark: `<= ${benchmark.threshold} ${benchmark.unit}`,
      reason: passes
        ? `Value ${numericValue} meets maximum ${benchmark.threshold}`
        : `Value ${numericValue} exceeds maximum ${benchmark.threshold}`
    };
  }

  return { applicable: false, reason: 'unknown_benchmark_type' };
}

export function getAllBenchmarkedParameters() {
  return Object.keys(CPCB_CLASS_B.parameters);
}

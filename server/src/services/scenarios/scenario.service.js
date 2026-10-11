/**
 * Scenario comparison service — owned by Gaurvee (docs/GAURVEE.md).
 *
 * Compares hypothetical water quality values against CPCB Class B benchmarks.
 */

import { checkBenchmark, CPCB_CLASS_B } from '../../config/benchmarks.js';

/**
 * @param {{ ghatId: string, scenarioType: string, assumptions: { description: string, changedInputs: Array<{input: string, value: unknown}> } }} request
 * @param {{ dataContext: object }} context
 */
export function compareScenario(request, { dataContext }) {
  const { ghatId, assumptions } = request;
  const ghat = dataContext.ghats.get(ghatId);

  const historicalBaseline = calculateHistoricalBaseline(ghat);
  const changedInputsMap = new Map(
    assumptions.changedInputs.map((ci) => [ci.input.toLowerCase(), ci.value])
  );

  const results = [];
  const benchmarkedParams = ['Dissolved oxygen', 'BOD', 'pH'];

  for (const param of benchmarkedParams) {
    const paramKey = param.toLowerCase().replace(/\s+/g, '_');
    const hypotheticalValue = changedInputsMap.get(paramKey) ?? changedInputsMap.get(param.toLowerCase());

    if (hypotheticalValue !== undefined && typeof hypotheticalValue === 'number') {
      const benchmarkResult = checkBenchmark(param, hypotheticalValue);
      const baseline = historicalBaseline[param];

      results.push({
        parameter: param,
        hypotheticalValue,
        benchmark: benchmarkResult.applicable ? benchmarkResult.benchmark : null,
        passes: benchmarkResult.applicable ? benchmarkResult.passes : null,
        exceedance: benchmarkResult.applicable ? benchmarkResult.exceedance : null,
        reason: benchmarkResult.reason,
        baseline: baseline
          ? {
              average: baseline.avg,
              min: baseline.min,
              max: baseline.max,
              sampleCount: baseline.count,
            }
          : null,
      });
    }
  }

  return {
    ghatId,
    ghatName: ghat.name,
    scenarioType: request.scenarioType,
    assumptions: {
      description: assumptions.description,
      changedInputs: assumptions.changedInputs,
    },
    results,
    benchmarkReference: {
      name: CPCB_CLASS_B.name,
      source: CPCB_CLASS_B.source,
      sourceUrl: CPCB_CLASS_B.sourceUrl,
    },
    limitations: [
      'This is a hypothetical scenario comparison, not a prediction.',
      'Results are based on static threshold comparison only.',
      'Does not account for temporal variation, seasonal effects, or measurement uncertainty.',
      'Historical baseline is derived from MPPCB reports (2023-2025) which may not reflect current conditions.',
    ],
    calculationMethod: 'Direct comparison of hypothetical values against CPCB Class B water quality criteria thresholds.',
  };
}

function calculateHistoricalBaseline(ghat) {
  const baseline = {};

  if (!ghat || !ghat.observations) return baseline;

  const params = ['Dissolved oxygen', 'BOD', 'pH'];

  for (const param of params) {
    const validObs = ghat.observations.filter(
      (o) => o.parameter === param && o.numericValue !== null && o.validationStatus === 'valid'
    );

    if (validObs.length > 0) {
      const values = validObs.map((o) => o.numericValue);
      baseline[param] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }
  }

  return baseline;
}

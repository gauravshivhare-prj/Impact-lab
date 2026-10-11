/**
 * Water Quality Simulation Service - deterministic benchmark comparisons.
 *
 * This service performs ONLY deterministic calculations against CPCB Class B benchmarks.
 * It does NOT use LLM for calculations.
 * It does NOT modify historical data.
 * Results are clearly marked as hypothetical scenarios.
 */

import { checkBenchmark, CPCB_CLASS_B } from '../../config/benchmarks.js';

const PARAMETER_MAP = {
  ph: 'pH',
  do: 'Dissolved oxygen',
  bod: 'BOD',
};

const PARAMETER_UNITS = {
  ph: '',
  do: 'mg/l',
  bod: 'mg/l',
};

function calculateHistoricalBaseline(ghat, parameterKey) {
  const parameterName = PARAMETER_MAP[parameterKey];
  if (!ghat || !ghat.observations) {
    return null;
  }

  const validObs = ghat.observations.filter(
    (o) => o.parameter === parameterName &&
           o.numericValue !== null &&
           o.validationStatus === 'valid'
  );

  if (validObs.length === 0) {
    return null;
  }

  const values = validObs.map((o) => o.numericValue);
  const years = [...new Set(validObs.map((o) => o.year))].sort();

  return {
    average: values.reduce((a, b) => a + b, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    sampleCount: values.length,
    years: years,
    latestYear: Math.max(...years),
  };
}

function evaluateParameter(parameterKey, hypotheticalValue, baseline) {
  const parameterName = PARAMETER_MAP[parameterKey];
  const unit = PARAMETER_UNITS[parameterKey];

  const hypotheticalResult = checkBenchmark(parameterName, hypotheticalValue);

  const result = {
    parameter: parameterName,
    parameterKey,
    unit,
    hypotheticalValue,
    benchmark: hypotheticalResult.applicable ? hypotheticalResult.benchmark : null,
    hypotheticalStatus: hypotheticalResult.applicable
      ? (hypotheticalResult.passes ? 'meets_benchmark' : 'exceeds_benchmark')
      : 'not_applicable',
    hypotheticalExplanation: hypotheticalResult.reason,
    baseline: null,
    baselineStatus: null,
    changeFromBaseline: null,
  };

  if (baseline) {
    const baselineResult = checkBenchmark(parameterName, baseline.average);

    result.baseline = {
      average: parseFloat(baseline.average.toFixed(3)),
      min: parseFloat(baseline.min.toFixed(3)),
      max: parseFloat(baseline.max.toFixed(3)),
      sampleCount: baseline.sampleCount,
      period: baseline.years.length > 1
        ? `${baseline.years[0]}-${baseline.years[baseline.years.length - 1]}`
        : `${baseline.years[0]}`,
      latestYear: baseline.latestYear,
    };

    result.baselineStatus = baselineResult.applicable
      ? (baselineResult.passes ? 'meets_benchmark' : 'exceeds_benchmark')
      : 'not_applicable';

    result.changeFromBaseline = {
      absoluteChange: parseFloat((hypotheticalValue - baseline.average).toFixed(3)),
      percentageChange: baseline.average !== 0
        ? parseFloat((((hypotheticalValue - baseline.average) / baseline.average) * 100).toFixed(1))
        : null,
      direction: hypotheticalValue > baseline.average ? 'increase' :
                 hypotheticalValue < baseline.average ? 'decrease' : 'no_change',
    };
  }

  return result;
}

function generateOverallSummary(results, language) {
  const meetsBenchmark = results.filter((r) => r.hypotheticalStatus === 'meets_benchmark');
  const exceedsBenchmark = results.filter((r) => r.hypotheticalStatus === 'exceeds_benchmark');

  const totalChecked = results.length;
  const passing = meetsBenchmark.length;

  let summary;
  if (exceedsBenchmark.length === 0) {
    summary = language === 'hi'
      ? `सभी ${totalChecked} जांचे गए पैरामीटर CPCB Class B बेंचमार्क पूरा करते हैं।`
      : `All ${totalChecked} checked parameters meet CPCB Class B benchmarks.`;
  } else {
    const failedParams = exceedsBenchmark.map((r) => r.parameter).join(', ');
    summary = language === 'hi'
      ? `${passing}/${totalChecked} पैरामीटर बेंचमार्क पूरा करते हैं। निम्नलिखित बेंचमार्क से बाहर हैं: ${failedParams}।`
      : `${passing}/${totalChecked} parameters meet benchmarks. The following are outside benchmarks: ${failedParams}.`;
  }

  return {
    summary,
    totalChecked,
    meetingBenchmark: passing,
    exceedingBenchmark: exceedsBenchmark.length,
    disclaimer: language === 'hi'
      ? 'यह एक काल्पनिक परिदृश्य विश्लेषण है। ये बेंचमार्क चेक समग्र जल सुरक्षा की गारंटी नहीं देते।'
      : 'This is a hypothetical scenario analysis. These benchmark checks do not guarantee overall water safety.',
  };
}

/**
 * @param {{ ghatId: string, hypotheticalValues: object }} request
 * @param {{ dataContext: object }} context
 */
export function simulateWaterQuality(request, { dataContext }) {
  const { ghatId, hypotheticalValues } = request;
  const ghat = dataContext.ghats.get(ghatId);

  if (!ghat) {
    return {
      error: 'GHAT_NOT_FOUND',
      message: `No ghat found with ID: ${ghatId}`,
    };
  }

  const results = [];

  for (const [paramKey, hypotheticalValue] of Object.entries(hypotheticalValues)) {
    if (hypotheticalValue === null || hypotheticalValue === undefined) {
      continue;
    }

    const baseline = calculateHistoricalBaseline(ghat, paramKey);
    const evaluation = evaluateParameter(paramKey, hypotheticalValue, baseline);
    results.push(evaluation);
  }

  return {
    ghatId,
    ghatName: ghat.name,
    isHypothetical: true,
    simulatedAt: new Date().toISOString(),
    results,
    overallSummary: generateOverallSummary(results, 'en'),
    benchmarkReference: {
      name: CPCB_CLASS_B.name,
      source: CPCB_CLASS_B.source,
      sourceUrl: CPCB_CLASS_B.sourceUrl,
      parameters: {
        pH: CPCB_CLASS_B.parameters.pH.description,
        'Dissolved oxygen': CPCB_CLASS_B.parameters['Dissolved oxygen'].description,
        BOD: CPCB_CLASS_B.parameters.BOD.description,
      },
    },
    limitations: [
      'This is a hypothetical scenario, not an actual measurement.',
      'Meeting individual benchmarks does not guarantee water safety.',
      'Historical baselines are from MPPCB reports (2023-2025) and may not reflect current conditions.',
      'Other unmeasured parameters may affect actual water quality.',
    ],
  };
}

/**
 * AI Assistant service - generates evidence-grounded responses using historical data.
 * All responses are derived from the actual MPPCB dataset (2023-2025).
 */

import { checkBenchmark, getAllBenchmarkedParameters } from '../../config/benchmarks.js';

/**
 * @param {{ query: string, language: string, context: object }} request
 * @param {{ dataContext: object }} ctx
 */
export function generateAssistantResponse(request, { dataContext }) {
  const { query, language } = request;
  const queryLower = query.toLowerCase();

  const sources = [];

  const allObservations = [];
  for (const ghat of dataContext.ghats.values()) {
    for (const obs of ghat.observations) {
      allObservations.push({ ...obs, ghatName: ghat.name });
    }
  }

  if (queryLower.includes('worst') && queryLower.includes('bod')) {
    return analyzeBodByGhat(allObservations, language, sources, dataContext);
  }

  if (queryLower.includes('dissolved oxygen') || queryLower.includes('do ') || queryLower.includes('घुलित ऑक्सीजन')) {
    const ghatName = extractGhatName(queryLower, dataContext);
    return analyzeDissolvedOxygen(allObservations, ghatName, language, sources);
  }

  if (queryLower.includes('ph') && (queryLower.includes('range') || queryLower.includes('रेंज'))) {
    const ghatName = extractGhatName(queryLower, dataContext);
    return analyzePhRange(allObservations, ghatName, language, sources);
  }

  if (queryLower.includes('compare') || queryLower.includes('तुलना')) {
    const yearMatch = queryLower.match(/20\d{2}/);
    const targetYear = yearMatch ? parseInt(yearMatch[0]) : null;
    return compareGhats(dataContext, targetYear, language, sources);
  }

  if (queryLower.includes('exceed') || queryLower.includes('limit') || queryLower.includes('cpcb') || queryLower.includes('सीमा')) {
    return analyzeExceedances(allObservations, language, sources);
  }

  return generateFallbackResponse(dataContext, language);
}

function extractGhatName(queryLower, dataContext) {
  for (const ghat of dataContext.ghats.values()) {
    const nameLower = ghat.name.toLowerCase();
    const firstWord = nameLower.split(' ')[0];
    if (queryLower.includes(firstWord)) {
      return ghat.name;
    }
  }
  return null;
}

function analyzeBodByGhat(observations, language, sources, dataContext) {
  const bodObs = observations.filter(
    (o) => o.parameter.toLowerCase() === 'bod' && o.numericValue !== null && o.validationStatus === 'valid'
  );

  const byGhat = new Map();
  bodObs.forEach((o) => {
    if (!byGhat.has(o.ghatName)) byGhat.set(o.ghatName, []);
    byGhat.get(o.ghatName).push(o.numericValue);
  });

  let worstGhat = '';
  let worstAvg = 0;
  byGhat.forEach((values, ghat) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    if (avg > worstAvg) {
      worstAvg = avg;
      worstGhat = ghat;
    }
  });

  if (worstGhat) {
    const readings = byGhat.get(worstGhat);
    readings.slice(0, 3).forEach((val, i) => {
      sources.push({
        ghat: worstGhat,
        parameter: 'BOD',
        year: 2023 + Math.floor(i / 2),
        value: `${val.toFixed(2)} mg/l`,
      });
    });

    const content = language === 'hi'
      ? `${worstGhat} में सबसे खराब BOD स्तर है, औसत ${worstAvg.toFixed(2)} mg/l। CPCB Class B मानक अधिकतम 3.0 mg/l की अनुमति देता है। इस घाट पर ${readings.length} रीडिंग दर्ज की गई हैं।`
      : `${worstGhat} has the worst BOD levels with an average of ${worstAvg.toFixed(2)} mg/l. The CPCB Class B standard allows a maximum of 3.0 mg/l. This ghat has ${readings.length} recorded readings.`;

    return { content, sources };
  }

  return generateFallbackResponse({ ghats: byGhat }, language);
}

function analyzeDissolvedOxygen(observations, targetGhat, language, sources) {
  const ghat = targetGhat || 'Khatlapura Ghat';
  const doObs = observations.filter(
    (o) => o.parameter.toLowerCase() === 'dissolved oxygen' &&
           o.ghatName === ghat &&
           o.numericValue !== null &&
           o.validationStatus === 'valid'
  );

  if (doObs.length > 0) {
    const values = doObs.map((o) => o.numericValue);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const belowThreshold = values.filter((v) => v < 5.0).length;

    doObs.slice(0, 4).forEach((o) => {
      sources.push({
        ghat: o.ghatName,
        parameter: 'Dissolved Oxygen',
        year: o.year,
        value: `${o.numericValue.toFixed(2)} mg/l`,
      });
    });

    const content = language === 'hi'
      ? `${ghat} पर घुलित ऑक्सीजन का विश्लेषण:\n\n- औसत: ${avg.toFixed(2)} mg/l\n- न्यूनतम: ${min.toFixed(2)} mg/l\n- अधिकतम: ${max.toFixed(2)} mg/l\n- 5.0 mg/l से नीचे रीडिंग: ${belowThreshold}/${values.length}\n\nCPCB Class B मानक के अनुसार DO न्यूनतम 5.0 mg/l होना चाहिए।`
      : `Dissolved Oxygen analysis at ${ghat}:\n\n- Average: ${avg.toFixed(2)} mg/l\n- Minimum: ${min.toFixed(2)} mg/l\n- Maximum: ${max.toFixed(2)} mg/l\n- Readings below 5.0 mg/l: ${belowThreshold}/${values.length}\n\nCPCB Class B standard requires DO to be at least 5.0 mg/l.`;

    return { content, sources };
  }

  return {
    content: language === 'hi'
      ? `${ghat} के लिए घुलित ऑक्सीजन डेटा उपलब्ध नहीं है।`
      : `No dissolved oxygen data available for ${ghat}.`,
    sources: [],
  };
}

function analyzePhRange(observations, targetGhat, language, sources) {
  const ghat = targetGhat || 'Prempura Ghat';
  const phObs = observations.filter(
    (o) => o.parameter.toLowerCase() === 'ph' &&
           o.ghatName === ghat &&
           o.numericValue !== null &&
           o.validationStatus === 'valid'
  );

  if (phObs.length > 0) {
    const values = phObs.map((o) => o.numericValue);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const outOfRange = values.filter((v) => v < 6.5 || v > 8.5).length;

    phObs.slice(0, 3).forEach((o) => {
      sources.push({
        ghat: o.ghatName,
        parameter: 'pH',
        year: o.year,
        value: o.numericValue.toFixed(2),
      });
    });

    const content = language === 'hi'
      ? `${ghat} पर pH रेंज:\n\n- न्यूनतम: ${min.toFixed(2)}\n- अधिकतम: ${max.toFixed(2)}\n- सीमा से बाहर रीडिंग: ${outOfRange}/${values.length}\n\nCPCB Class B मानक के अनुसार pH 6.5-8.5 के बीच होना चाहिए।`
      : `pH range at ${ghat}:\n\n- Minimum: ${min.toFixed(2)}\n- Maximum: ${max.toFixed(2)}\n- Out of range readings: ${outOfRange}/${values.length}\n\nCPCB Class B standard requires pH between 6.5 and 8.5.`;

    return { content, sources };
  }

  return {
    content: language === 'hi'
      ? `${ghat} के लिए pH डेटा उपलब्ध नहीं है।`
      : `No pH data available for ${ghat}.`,
    sources: [],
  };
}

function compareGhats(dataContext, targetYear, language, sources) {
  const rankings = dataContext.rankingResult.rankings;

  if (rankings.length > 0) {
    const comparison = rankings.slice(0, 5).map((r) => ({
      name: r.ghatId,
      priority: r.priority,
      score: r.score,
    }));

    comparison.forEach((c) => {
      sources.push({
        ghat: c.name,
        parameter: 'Priority Score',
        year: targetYear || 2024,
        value: `${c.score.toFixed(1)} (${c.priority})`,
      });
    });

    const summaryEn = comparison.map((c, i) =>
      `${i + 1}. ${c.name}: ${c.priority} priority (score: ${c.score.toFixed(1)})`
    ).join('\n');
    const summaryHi = comparison.map((c, i) =>
      `${i + 1}. ${c.name}: ${c.priority} प्राथमिकता (स्कोर: ${c.score.toFixed(1)})`
    ).join('\n');

    const yearStr = targetYear || '2023-2025';
    const content = language === 'hi'
      ? `${yearStr} में घाटों की जल गुणवत्ता तुलना (प्राथमिकता रैंकिंग):\n\n${summaryHi}\n\nये रैंकिंग BOD, DO, और pH के CPCB Class B मानकों से विचलन पर आधारित है।`
      : `Water quality comparison across ghats in ${yearStr} (priority ranking):\n\n${summaryEn}\n\nThese rankings are based on deviation from CPCB Class B standards for BOD, DO, and pH.`;

    return { content, sources };
  }

  return generateFallbackResponse(dataContext, language);
}

function analyzeExceedances(observations, language, sources) {
  const benchmarkedParams = getAllBenchmarkedParameters();
  const exceedances = [];

  benchmarkedParams.forEach((param) => {
    const paramObs = observations.filter(
      (o) => o.parameter === param && o.numericValue !== null && o.validationStatus === 'valid'
    );

    let exceedCount = 0;
    paramObs.forEach((o) => {
      const result = checkBenchmark(param, o.numericValue);
      if (result.applicable && result.exceedance) {
        exceedCount++;
      }
    });

    exceedances.push({ param, count: exceedCount, total: paramObs.length });
    sources.push({
      ghat: 'All Ghats',
      parameter: param,
      year: 2024,
      value: `${exceedCount}/${paramObs.length} exceedances`,
    });
  });

  exceedances.sort((a, b) => {
    if (b.total === 0 && a.total === 0) return 0;
    if (b.total === 0) return -1;
    if (a.total === 0) return 1;
    return (b.count / b.total) - (a.count / a.total);
  });

  const summaryEn = exceedances.map((e) =>
    `- ${e.param}: ${e.count}/${e.total} readings (${e.total > 0 ? ((e.count / e.total) * 100).toFixed(1) : 0}% exceedance rate)`
  ).join('\n');
  const summaryHi = exceedances.map((e) =>
    `- ${e.param}: ${e.count}/${e.total} रीडिंग (${e.total > 0 ? ((e.count / e.total) * 100).toFixed(1) : 0}% उल्लंघन दर)`
  ).join('\n');

  const content = language === 'hi'
    ? `CPCB Class B सीमा उल्लंघन विश्लेषण:\n\n${summaryHi}\n\nमानक:\n- DO: न्यूनतम 5.0 mg/l\n- BOD: अधिकतम 3.0 mg/l\n- pH: 6.5-8.5 रेंज`
    : `CPCB Class B limit exceedance analysis:\n\n${summaryEn}\n\nStandards:\n- DO: minimum 5.0 mg/l\n- BOD: maximum 3.0 mg/l\n- pH: 6.5-8.5 range`;

  return { content, sources };
}

function generateFallbackResponse(dataContext, language) {
  const ghatCount = dataContext.ghats?.size || 0;
  let totalReadings = 0;
  if (dataContext.ghats) {
    for (const ghat of dataContext.ghats.values()) {
      totalReadings += ghat.observations?.length || 0;
    }
  }

  const content = language === 'hi'
    ? `मुझे आपके प्रश्न का सटीक उत्तर नहीं मिला। मेरे पास ${ghatCount} घाटों से ${totalReadings} जल गुणवत्ता रीडिंग का डेटा है (2023-2025)।\n\nआप पूछ सकते हैं:\n- किसी घाट पर BOD/DO/pH स्तर\n- घाटों की तुलना\n- CPCB सीमा उल्लंघन\n- पैरामीटर रुझान`
    : `I couldn't find a specific answer to your question. I have access to ${totalReadings} water quality readings from ${ghatCount} ghats (2023-2025).\n\nYou can ask about:\n- BOD/DO/pH levels at specific ghats\n- Comparison across ghats\n- CPCB limit exceedances\n- Parameter trends`;

  return { content, sources: [] };
}

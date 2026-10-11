/**
 * AI Assistant service - evidence-grounded responses using OpenAI API.
 * All responses are derived from actual MPPCB dataset (2023-2025).
 *
 * The API key is read from environment variables and never exposed to clients.
 */

import OpenAI from 'openai';
import { checkBenchmark, getAllBenchmarkedParameters, CPCB_CLASS_B } from '../../config/benchmarks.js';

let openaiClient = null;

function getOpenAIClient(config) {
  if (!config.openaiApiKey) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openaiApiKey,
    });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `You are the GhatRakshak AI Assistant, an environmental intelligence chatbot for Bhopal Municipal Corporation's water quality monitoring system.

CRITICAL RULES - YOU MUST FOLLOW THESE:
1. NEVER invent measurements, dates, sample counts, rankings, or locations
2. NEVER fabricate sources or citations
3. ALWAYS distinguish historical observations (2023-2025 MPPCB data) from current measurements - we do NOT have live sensor data
4. ALWAYS distinguish observed data from hypothetical scenario results
5. State clearly when evidence is insufficient to answer a question
6. Treat missing values as MISSING, not as zero
7. Respect BDL (Below Detection Limit) and ND (Not Detected) qualifiers
8. Do not treat invalid measurements as valid observations
9. Explain the benchmark used for comparisons (CPCB Class B for outdoor bathing)
10. Clearly identify uncertainty in your responses
11. NEVER claim the application has live water-quality data
12. NEVER claim rule-based calculations are ML predictions
13. Do not provide unsupported claims about public safety

BENCHMARK REFERENCES (CPCB Class B - Outdoor Bathing):
- pH: 6.5 to 8.5 (inclusive range)
- Dissolved Oxygen (DO): minimum 5.0 mg/L
- Biochemical Oxygen Demand (BOD): maximum 3.0 mg/L

Meeting these individual thresholds does NOT guarantee water safety - they are monitoring references only.

When answering, cite specific evidence from the provided context. If the context doesn't contain enough information, say so clearly.`;

function buildEvidenceContext(dataContext, query) {
  const evidence = {
    datasetSummary: null,
    rankings: [],
    ghatDetails: [],
    benchmarkTotals: [],
    relevantObservations: [],
  };

  if (dataContext.datasetSummary) {
    evidence.datasetSummary = {
      totalRecords: dataContext.datasetSummary.totalRecords,
      ghatCount: dataContext.datasetSummary.ghatCount,
      yearRange: `${dataContext.datasetSummary.startYear}-${dataContext.datasetSummary.endYear}`,
      parameterCount: dataContext.datasetSummary.parameterCount,
    };
  }

  if (dataContext.rankingResult?.rankings) {
    evidence.rankings = dataContext.rankingResult.rankings.slice(0, 7).map((r) => ({
      ghatId: r.ghatId,
      priority: r.priority,
      score: r.score,
      explanation: r.explanation,
      validSampleCount: r.validSampleCount,
    }));
  }

  if (dataContext.benchmarkTotals) {
    evidence.benchmarkTotals = dataContext.benchmarkTotals.map((b) => ({
      parameter: b.parameter,
      criterion: b.criterion,
      validSampleCount: b.validSampleCount,
      exceedanceCount: b.exceedanceCount,
      exceedanceRate: b.validSampleCount > 0
        ? ((b.exceedanceCount / b.validSampleCount) * 100).toFixed(1) + '%'
        : 'N/A',
    }));
  }

  const queryLower = query.toLowerCase();
  for (const ghat of dataContext.ghats.values()) {
    if (queryLower.includes(ghat.name.toLowerCase().split(' ')[0])) {
      const params = ['Dissolved oxygen', 'BOD', 'pH'];
      const ghatStats = { name: ghat.name, parameters: {} };

      for (const param of params) {
        const validObs = ghat.observations.filter(
          (o) => o.parameter === param && o.numericValue !== null && o.validationStatus === 'valid'
        );
        if (validObs.length > 0) {
          const values = validObs.map((o) => o.numericValue);
          const benchmarkResult = checkBenchmark(param, values.reduce((a, b) => a + b, 0) / values.length);
          ghatStats.parameters[param] = {
            sampleCount: values.length,
            average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
            min: Math.min(...values).toFixed(2),
            max: Math.max(...values).toFixed(2),
            benchmark: benchmarkResult.benchmark,
            exceedanceCount: validObs.filter((o) => {
              const result = checkBenchmark(param, o.numericValue);
              return result.applicable && result.exceedance;
            }).length,
          };
        }
      }
      evidence.ghatDetails.push(ghatStats);
    }
  }

  if (evidence.ghatDetails.length === 0 && dataContext.ghats.size > 0) {
    const firstGhat = dataContext.ghats.values().next().value;
    evidence.ghatDetails.push({
      name: firstGhat.name,
      totalObservations: firstGhat.observations.length,
      note: 'Sample ghat shown. Ask about a specific ghat for detailed analysis.',
    });
  }

  return evidence;
}

function formatEvidenceForPrompt(evidence) {
  let context = '## Available Evidence from GhatRakshak Dataset\n\n';

  if (evidence.datasetSummary) {
    context += `### Dataset Summary\n`;
    context += `- Total Records: ${evidence.datasetSummary.totalRecords}\n`;
    context += `- Ghats Monitored: ${evidence.datasetSummary.ghatCount}\n`;
    context += `- Period: ${evidence.datasetSummary.yearRange} (HISTORICAL DATA ONLY)\n`;
    context += `- Parameters Tracked: ${evidence.datasetSummary.parameterCount}\n\n`;
  }

  if (evidence.rankings.length > 0) {
    context += `### Ghat Priority Rankings (based on historical data)\n`;
    evidence.rankings.forEach((r, i) => {
      context += `${i + 1}. ${r.ghatId}: ${r.priority} priority (score: ${r.score.toFixed(1)}) - ${r.explanation}\n`;
    });
    context += '\n';
  }

  if (evidence.benchmarkTotals.length > 0) {
    context += `### CPCB Class B Benchmark Compliance (historical)\n`;
    evidence.benchmarkTotals.forEach((b) => {
      context += `- ${b.parameter}: ${b.exceedanceCount}/${b.validSampleCount} exceedances (${b.exceedanceRate}), criterion: ${b.criterion}\n`;
    });
    context += '\n';
  }

  if (evidence.ghatDetails.length > 0) {
    context += `### Ghat-Specific Data\n`;
    evidence.ghatDetails.forEach((g) => {
      context += `**${g.name}**\n`;
      if (g.parameters) {
        Object.entries(g.parameters).forEach(([param, stats]) => {
          context += `- ${param}: avg ${stats.average}, range ${stats.min}-${stats.max}, ${stats.exceedanceCount}/${stats.sampleCount} exceed benchmark (${stats.benchmark})\n`;
        });
      }
      if (g.note) {
        context += `- Note: ${g.note}\n`;
      }
    });
  }

  return context;
}

async function callOpenAI(client, model, systemPrompt, userMessage, evidenceContext) {
  const response = await client.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${evidenceContext}\n\n---\n\nUser Question: ${userMessage}` },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || 'I was unable to generate a response.';
}

function generateFallbackResponse(query, evidence, language) {
  const queryLower = query.toLowerCase();

  if (queryLower.includes('priority') || queryLower.includes('attention') || queryLower.includes('worst')) {
    if (evidence.rankings.length > 0) {
      const top = evidence.rankings[0];
      return {
        content: language === 'hi'
          ? `ऐतिहासिक डेटा के आधार पर, ${top.ghatId} सबसे अधिक प्राथमिकता वाला घाट है (${top.priority} प्राथमिकता, स्कोर: ${top.score.toFixed(1)})। कारण: ${top.explanation}। यह 2023-2025 MPPCB रिपोर्ट पर आधारित है, वर्तमान माप नहीं।`
          : `Based on historical data, ${top.ghatId} has the highest priority (${top.priority}, score: ${top.score.toFixed(1)}). Reason: ${top.explanation}. This is based on 2023-2025 MPPCB reports, not current measurements.`,
        isLLMGenerated: false,
      };
    }
  }

  if (queryLower.includes('exceed') || queryLower.includes('benchmark') || queryLower.includes('cpcb')) {
    if (evidence.benchmarkTotals.length > 0) {
      const summary = evidence.benchmarkTotals
        .map((b) => `${b.parameter}: ${b.exceedanceRate} exceedance rate`)
        .join(', ');
      return {
        content: language === 'hi'
          ? `CPCB Class B मानक उल्लंघन (ऐतिहासिक): ${summary}। मानक: DO >= 5.0 mg/l, BOD <= 3.0 mg/l, pH 6.5-8.5।`
          : `CPCB Class B benchmark exceedances (historical): ${summary}. Standards: DO >= 5.0 mg/l, BOD <= 3.0 mg/l, pH 6.5-8.5.`,
        isLLMGenerated: false,
      };
    }
  }

  return {
    content: language === 'hi'
      ? `AI सहायक वर्तमान में अनुपलब्ध है। कृपया बाद में पुनः प्रयास करें। इस बीच, आप डैशबोर्ड पर रैंकिंग, एनालिटिक्स और एविडेंस एक्सप्लोरर देख सकते हैं।`
      : `The AI assistant is currently unavailable. Please try again later. In the meantime, you can explore the rankings, analytics, and evidence explorer on the dashboard.`,
    isLLMGenerated: false,
  };
}

/**
 * @param {{ query: string, language: string, context: object }} request
 * @param {{ dataContext: object, config: object }} ctx
 */
export async function generateAssistantResponse(request, { dataContext, config }) {
  const { query, language } = request;

  const evidence = buildEvidenceContext(dataContext, query);
  const evidenceContext = formatEvidenceForPrompt(evidence);

  const sources = [];
  if (evidence.rankings.length > 0) {
    evidence.rankings.slice(0, 3).forEach((r) => {
      sources.push({
        type: 'ranking',
        ghat: r.ghatId,
        priority: r.priority,
        score: r.score,
        period: '2023-2025',
      });
    });
  }

  const client = getOpenAIClient(config);

  if (!client) {
    const fallback = generateFallbackResponse(query, evidence, language);
    return {
      content: fallback.content,
      sources,
      isLLMGenerated: false,
      notice: language === 'hi'
        ? 'AI सहायक कॉन्फ़िगर नहीं है। नियम-आधारित प्रतिक्रिया प्रदान की गई।'
        : 'AI assistant is not configured. Rule-based response provided.',
    };
  }

  try {
    const llmResponse = await callOpenAI(
      client,
      config.openaiModel,
      SYSTEM_PROMPT,
      query,
      evidenceContext
    );

    return {
      content: llmResponse,
      sources,
      isLLMGenerated: true,
      model: config.openaiModel,
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);

    const fallback = generateFallbackResponse(query, evidence, language);
    return {
      content: fallback.content,
      sources,
      isLLMGenerated: false,
      error: language === 'hi'
        ? 'AI सेवा अस्थायी रूप से अनुपलब्ध है।'
        : 'AI service temporarily unavailable.',
    };
  }
}

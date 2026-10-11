/**
 * Report composition for POST /reports/brief.
 *
 * The brief is rendered deterministically from backend facts only (no AI model), in
 * English or Hindi. It never calculates scores or decides legal status itself.
 */

import { ApiError } from '../../middleware/errorHandler.js';
import { buildBriefFacts, toFactsUsed } from './briefFacts.service.js';
import { renderTemplateBrief } from './briefTemplate.service.js';

export function generateBrief({ dataContext, ghatId, language, includeScenario, now = () => new Date() }) {
  const facts = buildBriefFacts(dataContext, ghatId);
  if (!facts) throw new ApiError(404, 'GHAT_NOT_FOUND', 'No ghat exists with this ghatId.');

  const limitations = [...facts.limitations];
  if (includeScenario) {
    limitations.push('Scenario results are not included in this brief: the scenario service is not available yet.');
  }

  return {
    data: {
      language,
      brief: renderTemplateBrief(facts, language),
      factsUsed: toFactsUsed(facts),
      sourceIds: facts.sources.map((source) => source.sourceId),
      limitations,
      generatedAt: now().toISOString(),
    },
    meta: {},
  };
}

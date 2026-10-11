/**
 * Report composition for POST /reports/brief.
 *
 * Flow: backend facts -> (optional) Cerebras explanation -> fact check -> response.
 * The model only explains; it never calculates scores or decides legal status. Any AI
 * draft that contains a number not present in the facts, or is in the wrong language,
 * is discarded in favour of the deterministic template brief.
 */

import { ApiError } from '../../middleware/errorHandler.js';
import { AiProviderError } from './cerebras.service.js';
import { buildBriefFacts, toFactsUsed } from './briefFacts.service.js';
import { renderTemplateBrief } from './briefTemplate.service.js';

const MAX_BRIEF_LENGTH = 4000;
const MIN_DEVANAGARI_SHARE = 0.5;
const NUMBER_PATTERN = /\d+(?:\.\d+)?/g;
const NEGATIVE_NUMBER_PATTERN = /(?:^|[\s(:])[-−]\s?\d/;

// Numbers written as words bypass the digit check, so they are not allowed at all.
// "one"/"एक" are excluded because they are routinely used as pronouns/articles, and the
// BDL disclaimer "not zero" / "शून्य नहीं" is allowed.
const NUMBER_WORD_PATTERNS = [
  /(?<!\bnot\s+)\b(zero|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|half|quarter|dozen|twice|double|triple)\b/i,
  /(?<=^|[\s,(])(शून्य(?!\s+नहीं)|दो|तीन|चार|पांच|पाँच|छह|छः|सात|आठ|नौ|दस|बीस|पचास|सौ|हज़ार|हजार|आधा|आधे|आधी|दोगुना|दुगना)(?=[\s,।.;:)]|$)/,
];

// Claims the model must never make: safety, legal determinations, health or causal effects.
const PROHIBITED_CLAIM_PATTERNS = [
  // Neutral phrasing such as "does not decide whether immersion is permitted" is allowed.
  /(?<!whether\s+(?:\S+\s+){0,2})\b(is|are|was|were)\s+(safe|clean|permitted|allowed|prohibited|banned|legal|illegal)\b/i,
  /\bsafe\s+(for|to)\b/i,
  /\b(mortality|fish\s+(kill|kills|death|deaths|died)|disease|illness|health\s+(risk|effect|effects|impact))\b/i,
  /(सुरक्षित|स्वच्छ|वैध|अवैध)\s+(है|हैं|था|थे)/,
  /(मछलियों\s+की\s+मौत|मछलियाँ\s+मर|बीमारी|स्वास्थ्य\s+(पर|को|के\s+लिए)\s+(खतरा|असर|प्रभाव|हानि))/,
];

const LANGUAGE_INSTRUCTIONS = {
  en: 'Write entirely in plain English.',
  hi: 'Write entirely in Hindi using Devanagari script. Keep ghat names, DO, BOD, pH, mg/l and CPCB exactly as given.',
};

export function buildPrompt(facts, language) {
  const system = [
    'You write short briefs for a Bhopal Municipal Corporation officer who plans Durga visarjan and decides where to send extra cleaning, aeration and water testing.',
    'Use ONLY the facts in the JSON the user provides. Rules:',
    '1. Do not add, change, round or calculate any number. Copy numbers exactly as given, using digits 0-9 without thousands separators. Never write numbers as words.',
    '2. Do not claim health effects, fish deaths, causes of pollution, or current (2026) conditions.',
    '3. Do not state or imply that immersion is legally permitted or prohibited. Legal status is "not verified".',
    '4. Never describe any ghat as safe or clean.',
    '5. Missing (not sampled) readings are missing, never clean. BDL means below detection limit: very low, not zero.',
    '6. Mention the observation years, the source report pages, and the key limitations.',
    '7. Plain text only, no tables, at most 180 words.',
    LANGUAGE_INSTRUCTIONS[language],
  ].join('\n');

  const user = `FACTS (JSON):\n${JSON.stringify(facts)}`;
  return { system, user };
}

function toAsciiDigits(text) {
  return text.replace(/[०-९]/g, (digit) => String(digit.charCodeAt(0) - 0x0966));
}

function extractNumbers(text) {
  const normalised = toAsciiDigits(text).replace(/(\d),(?=\d{3}\b)/g, '$1');
  return (normalised.match(NUMBER_PATTERN) ?? []).map(Number);
}

/** Returns the numbers in `text` that do not appear anywhere in `facts`. */
export function findUnverifiedNumbers(text, facts) {
  const allowed = new Set(extractNumbers(JSON.stringify(facts)));
  return [...new Set(extractNumbers(text))].filter((value) => !allowed.has(value));
}

export function sanitiseModelText(text) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function devanagariShare(text) {
  const devanagari = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return devanagari + latin === 0 ? 0 : devanagari / (devanagari + latin);
}

/** Returns a rejection reason for an AI draft, or null when it passes every check. */
export function checkDraft(text, facts, language) {
  if (text === '' || text.length > MAX_BRIEF_LENGTH) return 'rejected_invalid_length';
  if (language === 'hi' && devanagariShare(text) < MIN_DEVANAGARI_SHARE) return 'rejected_wrong_language';
  if (PROHIBITED_CLAIM_PATTERNS.some((pattern) => pattern.test(text))) return 'rejected_prohibited_claim';
  if (NUMBER_WORD_PATTERNS.some((pattern) => pattern.test(text)) || NEGATIVE_NUMBER_PATTERN.test(toAsciiDigits(text))) {
    return 'rejected_unverified_numbers';
  }
  if (findUnverifiedNumbers(text, facts).length > 0) return 'rejected_unverified_numbers';
  return null;
}

function toApiError(err) {
  if (err.reason === 'rate_limited') {
    return new ApiError(429, 'RATE_LIMITED', 'The AI provider is rate limiting requests. Please try again shortly.');
  }
  return new ApiError(502, 'AI_PROVIDER_ERROR', 'The AI provider could not generate a brief. Please try again.');
}

export async function generateBrief({ dataContext, aiClient, ghatId, language, includeScenario, now = () => new Date() }) {
  const facts = buildBriefFacts(dataContext, ghatId);
  if (!facts) throw new ApiError(404, 'GHAT_NOT_FOUND', 'No ghat exists with this ghatId.');

  const limitations = [...facts.limitations];
  if (includeScenario) {
    limitations.push('Scenario results are not included in this brief: the scenario service is not available yet.');
  }

  let brief = renderTemplateBrief(facts, language);
  let generator = 'template';
  let aiStatus = 'not_configured';

  if (aiClient?.enabled) {
    let draft;
    try {
      draft = sanitiseModelText(await aiClient.generate(buildPrompt(facts, language)));
    } catch (err) {
      if (err instanceof AiProviderError) throw toApiError(err);
      throw err;
    }

    const rejection = checkDraft(draft, facts, language);
    if (rejection) {
      aiStatus = rejection;
    } else {
      brief = draft;
      generator = 'cerebras';
      aiStatus = 'ok';
    }
  }

  return {
    data: {
      language,
      brief,
      generator,
      factsUsed: toFactsUsed(facts),
      sourceIds: facts.sources.map((source) => source.sourceId),
      limitations,
      generatedAt: now().toISOString(),
    },
    meta: { aiStatus },
  };
}

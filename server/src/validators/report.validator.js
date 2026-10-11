import { assertGhatId, assertOnlyKeys, isPlainObject, validationError } from './common.validator.js';

export const BRIEF_LANGUAGES = Object.freeze(['en', 'hi']);

/**
 * Validates POST /reports/brief. Only identifiers and options are accepted —
 * never user-supplied facts (docs/API_CONTRACT.md).
 */
export function validateBriefRequest(req, res, next) {
  const body = req.body;
  if (!isPlainObject(body)) throw validationError('Request body must be a JSON object.');

  assertOnlyKeys(body, ['ghatId', 'language', 'includeScenario']);
  assertGhatId(body.ghatId);

  if (!BRIEF_LANGUAGES.includes(body.language)) {
    throw validationError('language must be "en" or "hi".');
  }
  if (body.includeScenario !== undefined && typeof body.includeScenario !== 'boolean') {
    throw validationError('includeScenario must be a boolean.');
  }

  req.validated = {
    ghatId: body.ghatId,
    language: body.language,
    includeScenario: body.includeScenario ?? false,
  };
  next();
}

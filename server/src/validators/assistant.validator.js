/**
 * Request validation for POST /assistant/chat.
 */

import { assertOnlyKeys, isPlainObject, validationError } from './common.validator.js';

const MAX_QUERY_LENGTH = 1000;
const SUPPORTED_LANGUAGES = ['en', 'hi'];

export function validateChatRequest(req, res, next) {
  const body = req.body;
  if (!isPlainObject(body)) throw validationError('Request body must be a JSON object.');

  assertOnlyKeys(body, ['query', 'language', 'context']);

  if (typeof body.query !== 'string' || body.query.trim() === '') {
    throw validationError('query must be a non-empty string.');
  }
  if (body.query.length > MAX_QUERY_LENGTH) {
    throw validationError(`query must be at most ${MAX_QUERY_LENGTH} characters.`);
  }

  const language = body.language ?? 'en';
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw validationError(`language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}.`);
  }

  const context = body.context ?? {};
  if (!isPlainObject(context)) {
    throw validationError('context must be an object.');
  }

  req.validated = {
    query: body.query.trim(),
    language,
    context,
  };
  next();
}

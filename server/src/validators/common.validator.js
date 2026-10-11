import { ApiError } from '../middleware/errorHandler.js';

// Canonical ghatIds are lowercase slugs, e.g. "khatlapura-ghat".
const GHAT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_GHAT_ID_LENGTH = 80;

export function validationError(message) {
  return new ApiError(400, 'VALIDATION_ERROR', message);
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function assertGhatId(value) {
  if (typeof value !== 'string' || value.length > MAX_GHAT_ID_LENGTH || !GHAT_ID_PATTERN.test(value)) {
    throw validationError('ghatId must be a canonical ghat ID (lowercase letters, digits and hyphens).');
  }
  return value;
}

export function assertOnlyKeys(body, allowedKeys) {
  const unknown = Object.keys(body).filter((key) => !allowedKeys.includes(key));
  if (unknown.length > 0) {
    throw validationError(`Unknown field(s): ${unknown.slice(0, 5).join(', ')}.`);
  }
}

function parseOptionalInteger(name, value, min, max) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d+$/.test(value) || Number(value) < min || Number(value) > max) {
    throw validationError(`${name} must be an integer between ${min} and ${max}.`);
  }
  return Number(value);
}

/** Parses optional ?limit=&offset= paging for observation lists. */
export function parsePaging(query) {
  return {
    limit: parseOptionalInteger('limit', query.limit, 1, 500),
    offset: parseOptionalInteger('offset', query.offset, 0, 100000) ?? 0,
  };
}

/** Express middleware: validates the :ghatId route parameter. */
export function validateGhatIdParam(req, res, next) {
  assertGhatId(req.params.ghatId);
  next();
}

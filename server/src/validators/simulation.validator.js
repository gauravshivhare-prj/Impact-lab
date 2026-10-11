/**
 * Request validation for POST /simulations/water-quality.
 */

import { assertGhatId, assertOnlyKeys, isPlainObject, validationError } from './common.validator.js';

const VALID_PARAMETERS = ['ph', 'do', 'bod'];
const MIN_VALUES = { ph: 0, do: 0, bod: 0 };
const MAX_VALUES = { ph: 14, do: 50, bod: 100 };

function validateHypotheticalValue(param, value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw validationError(`hypotheticalValues.${param} must be a finite number if provided.`);
  }

  if (Number.isNaN(value)) {
    throw validationError(`hypotheticalValues.${param} cannot be NaN.`);
  }

  if (value < MIN_VALUES[param]) {
    throw validationError(`hypotheticalValues.${param} cannot be negative.`);
  }

  if (value > MAX_VALUES[param]) {
    throw validationError(`hypotheticalValues.${param} exceeds reasonable maximum (${MAX_VALUES[param]}).`);
  }

  return value;
}

export function validateSimulationRequest(req, res, next) {
  const body = req.body;
  if (!isPlainObject(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  assertOnlyKeys(body, ['ghatId', 'hypotheticalValues']);
  assertGhatId(body.ghatId);

  const { hypotheticalValues } = body;
  if (!isPlainObject(hypotheticalValues)) {
    throw validationError('hypotheticalValues must be an object.');
  }

  const allowedKeys = [...VALID_PARAMETERS];
  const providedKeys = Object.keys(hypotheticalValues);
  for (const key of providedKeys) {
    if (!allowedKeys.includes(key)) {
      throw validationError(`hypotheticalValues contains unknown parameter: ${key}. Allowed: ${allowedKeys.join(', ')}.`);
    }
  }

  if (providedKeys.length === 0) {
    throw validationError('hypotheticalValues must contain at least one parameter (ph, do, or bod).');
  }

  const validated = {};
  for (const param of VALID_PARAMETERS) {
    if (hypotheticalValues[param] !== undefined) {
      validated[param] = validateHypotheticalValue(param, hypotheticalValues[param]);
    }
  }

  req.validated = {
    ghatId: body.ghatId,
    hypotheticalValues: validated,
  };
  next();
}

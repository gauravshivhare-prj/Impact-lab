/**
 * Request validation for POST /scenarios/compare (docs/API_CONTRACT.md).
 * Co-owned with Gaurvee: extend SCENARIO_TYPES / changedInputs rules together with
 * services/scenarios/scenario.service.js.
 */

import { assertGhatId, assertOnlyKeys, isPlainObject, validationError } from './common.validator.js';

export const SCENARIO_TYPES = Object.freeze(['hypothetical_monitoring_or_waste_management', 'water_quality_comparison']);

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_CHANGED_INPUTS = 20;
const MAX_INPUT_NAME_LENGTH = 100;
const MAX_STRING_VALUE_LENGTH = 200;

function validateChangedInput(item, index) {
  if (!isPlainObject(item)) throw validationError(`assumptions.changedInputs[${index}] must be an object.`);
  assertOnlyKeys(item, ['input', 'value']);

  if (typeof item.input !== 'string' || item.input.trim() === '' || item.input.length > MAX_INPUT_NAME_LENGTH) {
    throw validationError(`assumptions.changedInputs[${index}].input must be a non-empty string.`);
  }

  const { value } = item;
  const validValue =
    (typeof value === 'number' && Number.isFinite(value)) ||
    typeof value === 'boolean' ||
    (typeof value === 'string' && value.length <= MAX_STRING_VALUE_LENGTH);
  if (!validValue) {
    throw validationError(`assumptions.changedInputs[${index}].value must be a finite number, boolean or short string.`);
  }

  return { input: item.input.trim(), value };
}

export function validateScenarioRequest(req, res, next) {
  const body = req.body;
  if (!isPlainObject(body)) throw validationError('Request body must be a JSON object.');

  assertOnlyKeys(body, ['ghatId', 'scenarioType', 'assumptions']);
  assertGhatId(body.ghatId);

  if (!SCENARIO_TYPES.includes(body.scenarioType)) {
    throw validationError(`scenarioType must be one of: ${SCENARIO_TYPES.join(', ')}.`);
  }

  const { assumptions } = body;
  if (!isPlainObject(assumptions)) throw validationError('assumptions must be an object.');
  assertOnlyKeys(assumptions, ['description', 'changedInputs']);

  if (typeof assumptions.description !== 'string' || assumptions.description.length > MAX_DESCRIPTION_LENGTH) {
    throw validationError(`assumptions.description must be a string of at most ${MAX_DESCRIPTION_LENGTH} characters.`);
  }

  const changedInputs = assumptions.changedInputs ?? [];
  if (!Array.isArray(changedInputs) || changedInputs.length > MAX_CHANGED_INPUTS) {
    throw validationError(`assumptions.changedInputs must be an array of at most ${MAX_CHANGED_INPUTS} items.`);
  }

  req.validated = {
    ghatId: body.ghatId,
    scenarioType: body.scenarioType,
    assumptions: {
      description: assumptions.description.trim(),
      changedInputs: changedInputs.map(validateChangedInput),
    },
  };
  next();
}

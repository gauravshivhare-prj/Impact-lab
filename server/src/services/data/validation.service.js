/**
 * Validation Service
 * Validates water quality observations while preserving raw source values.
 * Handles missing, BDL, ND, and invalid values according to scientific conventions.
 */

const KNOWN_QUALIFIERS = ['BDL', 'ND', 'not sampled', '*', '**'];
const VALID_PHASES = ['pre', 'during', 'after'];
const VALID_FESTIVALS = ['Ganesh', 'Durga'];
const VALID_CONFIDENCE_LEVELS = ['high', 'medium', 'low'];

const VALID_PARAMETERS = [
  'pH', 'Dissolved oxygen', 'BOD', 'COD',
  'Total solids', 'Dissolved solids', 'Suspended solids',
  'Turbidity', 'Conductivity',
  'Chromium', 'Lead', 'Zinc', 'Copper'
];

export function validateObservation(observation) {
  const errors = [];
  let validationStatus = 'valid';
  let qualifier = null;
  let numericValue = null;

  if (!observation.site) {
    errors.push({ field: 'site', message: 'Site is required' });
  }

  if (!observation.parameter) {
    errors.push({ field: 'parameter', message: 'Parameter is required' });
  } else if (!VALID_PARAMETERS.includes(observation.parameter)) {
    errors.push({
      field: 'parameter',
      message: `Unknown parameter: ${observation.parameter}`,
      severity: 'warning'
    });
  }

  if (!observation.year) {
    errors.push({ field: 'year', message: 'Year is required' });
  } else {
    const yearNum = parseInt(observation.year, 10);
    if (Number.isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      errors.push({ field: 'year', message: `Invalid year: ${observation.year}` });
    }
  }

  if (observation.phase && !VALID_PHASES.includes(observation.phase)) {
    errors.push({
      field: 'phase',
      message: `Unknown phase: ${observation.phase}`,
      severity: 'warning'
    });
  }

  if (observation.festival && !VALID_FESTIVALS.includes(observation.festival)) {
    errors.push({
      field: 'festival',
      message: `Unknown festival: ${observation.festival}`,
      severity: 'warning'
    });
  }

  const valueResult = validateValue(observation);
  numericValue = valueResult.numericValue;
  qualifier = valueResult.qualifier;

  if (valueResult.status === 'missing') {
    validationStatus = 'missing';
    qualifier = 'missing';
  } else if (valueResult.status === 'qualified') {
    validationStatus = 'qualified';
  } else if (valueResult.status === 'invalid') {
    validationStatus = 'invalid';
    errors.push({ field: 'value', message: valueResult.message });
  }

  if (observation.siteMatchConfidence === 'medium') {
    errors.push({
      field: 'site',
      message: 'Site match confidence is medium - may need review',
      severity: 'warning'
    });
  } else if (observation.siteMatchConfidence === 'low') {
    errors.push({
      field: 'site',
      message: 'Site match confidence is low - needs manual review',
      severity: 'warning'
    });
  }

  if (validationStatus === 'valid' && errors.filter(e => e.severity !== 'warning').length > 0) {
    validationStatus = 'needs_review';
  }

  return {
    validationStatus,
    numericValue,
    qualifier,
    validationErrors: errors.length > 0 ? errors : null
  };
}

function validateValue(observation) {
  const { rawValue, flag, valueAsPrinted } = observation;

  if (flag && KNOWN_QUALIFIERS.includes(flag)) {
    if (flag === 'BDL') {
      return { status: 'qualified', qualifier: 'BDL', numericValue: null };
    }
    if (flag === 'ND') {
      return { status: 'qualified', qualifier: 'ND', numericValue: null };
    }
    if (flag === 'not sampled' || flag === '*' || flag === '**') {
      return { status: 'missing', qualifier: 'missing', numericValue: null };
    }
  }

  if (valueAsPrinted) {
    const printed = valueAsPrinted.toString().trim().toUpperCase();
    if (printed === 'BDL') {
      return { status: 'qualified', qualifier: 'BDL', numericValue: null };
    }
    if (printed === 'ND') {
      return { status: 'qualified', qualifier: 'ND', numericValue: null };
    }
    if (printed === '_' || printed === '-' || printed === '*' || printed === '**' || printed === '') {
      return { status: 'missing', qualifier: 'missing', numericValue: null };
    }
  }

  if (rawValue === null || rawValue === undefined || rawValue === '') {
    if (flag) {
      return { status: 'missing', qualifier: 'missing', numericValue: null };
    }
    return { status: 'missing', qualifier: 'missing', numericValue: null };
  }

  const rawStr = rawValue.toString().trim();

  if (rawStr === '' || rawStr === '-' || rawStr === '_' || rawStr === '*' || rawStr === '**') {
    return { status: 'missing', qualifier: 'missing', numericValue: null };
  }

  if (rawStr.toUpperCase() === 'BDL') {
    return { status: 'qualified', qualifier: 'BDL', numericValue: null };
  }
  if (rawStr.toUpperCase() === 'ND') {
    return { status: 'qualified', qualifier: 'ND', numericValue: null };
  }

  const numericValue = parseFloat(rawStr);

  if (Number.isNaN(numericValue)) {
    return {
      status: 'invalid',
      qualifier: null,
      numericValue: null,
      message: `Cannot parse numeric value: ${rawStr}`
    };
  }

  if (numericValue < 0 && observation.parameter !== 'pH') {
    return {
      status: 'invalid',
      qualifier: null,
      numericValue: null,
      message: `Negative value not expected for ${observation.parameter}: ${numericValue}`
    };
  }

  return { status: 'valid', qualifier: null, numericValue };
}

export function isValidForCalculation(observation) {
  return observation.validationStatus === 'valid' &&
         observation.numericValue !== null &&
         !Number.isNaN(observation.numericValue);
}

export function isMissing(observation) {
  return observation.validationStatus === 'missing' ||
         observation.qualifier === 'missing';
}

export function isBDL(observation) {
  return observation.qualifier === 'BDL';
}

export function isND(observation) {
  return observation.qualifier === 'ND';
}

export function isQualified(observation) {
  return observation.validationStatus === 'qualified' ||
         (observation.qualifier && observation.qualifier !== 'missing');
}

export function getValidParameters() {
  return [...VALID_PARAMETERS];
}

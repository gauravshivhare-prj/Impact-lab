/**
 * Normalisation Service
 * Normalises water quality observations while preserving original source values.
 * Does not perform unit conversions - only clarifies and standardises field values.
 */

const SITE_CANONICAL_MAPPING = {
  'Khatlapura ghat': 'khatlapura-ghat',
  'Bairagarh (Sant Hirdaram) kund': 'bairagarh-sant-hirdaram-kund',
  'Prempura ghat': 'prempura-ghat',
  'Rani Kamlapati ghat / Kamla Park kund': 'rani-kamlapati-ghat',
  'Hathaikheda dam / kund': 'hathaikheda-dam-kund',
  'Malikhedi kund': 'malikhedi-kund',
  'Shahpura lake ghat': 'shahpura-lake-ghat'
};

const PARAMETER_CANONICAL_MAPPING = {
  'pH': 'pH',
  'Dissolved oxygen': 'dissolved_oxygen',
  'BOD': 'bod',
  'COD': 'cod',
  'Total solids': 'total_solids',
  'Dissolved solids': 'dissolved_solids',
  'Suspended solids': 'suspended_solids',
  'Turbidity': 'turbidity',
  'Conductivity': 'conductivity',
  'Chromium': 'chromium',
  'Lead': 'lead',
  'Zinc': 'zinc',
  'Copper': 'copper'
};

export function normaliseObservation(observation) {
  const normalised = { ...observation };

  normalised.ghatId = normaliseGhatId(observation.site);
  normalised.parameterId = normaliseParameterId(observation.parameter);
  normalised.yearNumeric = observation.year ? parseInt(observation.year, 10) : null;

  if (Number.isNaN(normalised.yearNumeric)) {
    normalised.yearNumeric = null;
  }

  normalised.observationId = generateObservationId(normalised);
  normalised.sourceId = generateSourceId(normalised);

  return normalised;
}

function normaliseGhatId(site) {
  if (!site) return null;

  if (SITE_CANONICAL_MAPPING[site]) {
    return SITE_CANONICAL_MAPPING[site];
  }

  return site.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normaliseParameterId(parameter) {
  if (!parameter) return null;

  if (PARAMETER_CANONICAL_MAPPING[parameter]) {
    return PARAMETER_CANONICAL_MAPPING[parameter];
  }

  return parameter.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

function generateObservationId(observation) {
  const parts = [
    observation.ghatId || 'unknown',
    observation.yearNumeric || 'unknown',
    observation.festival || 'unknown',
    observation.phase || 'unknown',
    observation.parameterId || 'unknown'
  ];

  return parts.join('-').toLowerCase();
}

function generateSourceId(observation) {
  const parts = [
    'mppcb',
    observation.yearNumeric || 'unknown',
    observation.festival || 'unknown'
  ];

  return parts.join('-').toLowerCase();
}

export function getCanonicalGhatId(site) {
  return normaliseGhatId(site);
}

export function getCanonicalParameterId(parameter) {
  return normaliseParameterId(parameter);
}

export function getAllCanonicalGhatIds() {
  return Object.values(SITE_CANONICAL_MAPPING);
}

export function getGhatDisplayName(ghatId) {
  for (const [displayName, canonicalId] of Object.entries(SITE_CANONICAL_MAPPING)) {
    if (canonicalId === ghatId) {
      return displayName;
    }
  }
  return ghatId;
}

export function getParameterDisplayName(parameterId) {
  for (const [displayName, canonicalId] of Object.entries(PARAMETER_CANONICAL_MAPPING)) {
    if (canonicalId === parameterId) {
      return displayName;
    }
  }
  return parameterId;
}

export function getSiteMatchWarning(observation) {
  if (observation.siteMatchConfidence === 'medium') {
    return {
      level: 'warning',
      message: `Site "${observation.siteAsPrinted}" matched to "${observation.site}" with medium confidence. May refer to a different location.`
    };
  }
  if (observation.siteMatchConfidence === 'low') {
    return {
      level: 'error',
      message: `Site "${observation.siteAsPrinted}" matched to "${observation.site}" with low confidence. Manual review required.`
    };
  }
  return null;
}

export function groupByGhat(observations) {
  const groups = {};

  for (const obs of observations) {
    const ghatId = obs.ghatId || 'unknown';
    if (!groups[ghatId]) {
      groups[ghatId] = {
        ghatId,
        displayName: getGhatDisplayName(ghatId),
        observations: []
      };
    }
    groups[ghatId].observations.push(obs);
  }

  return groups;
}

export function groupByParameter(observations) {
  const groups = {};

  for (const obs of observations) {
    const parameterId = obs.parameterId || obs.parameter || 'unknown';
    if (!groups[parameterId]) {
      groups[parameterId] = {
        parameterId,
        displayName: getParameterDisplayName(parameterId) || obs.parameter,
        observations: []
      };
    }
    groups[parameterId].observations.push(obs);
  }

  return groups;
}

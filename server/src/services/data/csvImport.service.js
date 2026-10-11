/**
 * CSV Import Service
 * Parses historical water quality CSV files while preserving raw source values and provenance.
 */

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { validateObservation } from './validation.service.js';
import { normaliseObservation } from './normalisation.service.js';

const EXPECTED_HEADERS = [
  'year', 'festival', 'site', 'water_body', 'phase', 'parameter',
  'value', 'unit_assumed', 'flag', 'value_as_printed', 'parameter_as_printed',
  'site_as_printed', 'site_match_confidence', 'source_page'
];

export async function importCsvFile(filePath, options = {}) {
  const { skipValidation = false, skipNormalisation = false } = options;

  const records = [];
  const errors = [];
  const warnings = [];
  let rowNumber = 0;
  let headersValid = false;

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      on_record: (record, context) => {
        if (context.lines === 1) {
          const actualHeaders = Object.keys(record);
          const missingHeaders = EXPECTED_HEADERS.filter(h => !actualHeaders.includes(h));

          if (missingHeaders.length > 0) {
            warnings.push({
              type: 'missing_headers',
              headers: missingHeaders,
              message: `Missing expected headers: ${missingHeaders.join(', ')}`
            });
          }
          headersValid = true;
        }
        return record;
      }
    });

    const stream = createReadStream(filePath);

    stream.on('error', (err) => {
      reject(new Error(`Failed to read file: ${err.message}`));
    });

    parser.on('readable', function() {
      let record;
      while ((record = parser.read()) !== null) {
        rowNumber++;

        try {
          const rawObservation = parseRawRecord(record, rowNumber);

          let observation = rawObservation;

          if (!skipValidation) {
            const validationResult = validateObservation(rawObservation);
            observation = { ...observation, ...validationResult };

            if (validationResult.validationErrors?.length > 0) {
              errors.push({
                rowNumber,
                errors: validationResult.validationErrors
              });
            }
          }

          if (!skipNormalisation) {
            observation = normaliseObservation(observation);
          }

          records.push(observation);
        } catch (err) {
          errors.push({
            rowNumber,
            errors: [{ field: 'row', message: err.message }]
          });
        }
      }
    });

    parser.on('error', function(err) {
      reject(new Error(`CSV parsing error: ${err.message}`));
    });

    parser.on('end', function() {
      resolve({
        records,
        summary: generateSummary(records),
        errors,
        warnings,
        headersValid
      });
    });

    stream.pipe(parser);
  });
}

function parseRawRecord(record, rowNumber) {
  return {
    rowNumber,
    year: record.year || null,
    festival: record.festival || null,
    site: record.site || null,
    waterBody: record.water_body || null,
    phase: record.phase || null,
    parameter: record.parameter || null,
    rawValue: record.value,
    unitAssumed: record.unit_assumed || null,
    flag: record.flag || null,
    valueAsPrinted: record.value_as_printed || null,
    parameterAsPrinted: record.parameter_as_printed || null,
    siteAsPrinted: record.site_as_printed || null,
    siteMatchConfidence: record.site_match_confidence || null,
    sourcePage: record.source_page || null
  };
}

function generateSummary(records) {
  const sites = new Set();
  const parameters = new Set();
  const years = new Set();
  const festivals = new Set();
  const phases = new Set();
  let validNumericCount = 0;
  let missingCount = 0;
  let bdlCount = 0;
  let ndCount = 0;
  let invalidCount = 0;

  for (const record of records) {
    if (record.site) sites.add(record.site);
    if (record.parameter) parameters.add(record.parameter);
    if (record.year) years.add(record.year);
    if (record.festival) festivals.add(record.festival);
    if (record.phase) phases.add(record.phase);

    if (record.validationStatus === 'valid' && record.numericValue !== null) {
      validNumericCount++;
    } else if (record.validationStatus === 'missing' || record.qualifier === 'missing') {
      missingCount++;
    } else if (record.qualifier === 'BDL') {
      bdlCount++;
    } else if (record.qualifier === 'ND') {
      ndCount++;
    } else if (record.validationStatus === 'invalid') {
      invalidCount++;
    }
  }

  return {
    totalRecords: records.length,
    sites: Array.from(sites).sort(),
    siteCount: sites.size,
    parameters: Array.from(parameters).sort(),
    parameterCount: parameters.size,
    years: Array.from(years).sort(),
    yearRange: years.size > 0 ? {
      start: Math.min(...Array.from(years).map(Number)),
      end: Math.max(...Array.from(years).map(Number))
    } : null,
    festivals: Array.from(festivals).sort(),
    phases: Array.from(phases).sort(),
    validNumericCount,
    missingCount,
    bdlCount,
    ndCount,
    invalidCount
  };
}

export function importCsvSync(csvContent, options = {}) {
  const { skipValidation = false, skipNormalisation = false } = options;

  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) {
    return { records: [], summary: generateSummary([]), errors: [], warnings: [] };
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  const errors = [];
  const warnings = [];

  const missingHeaders = EXPECTED_HEADERS.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    warnings.push({
      type: 'missing_headers',
      headers: missingHeaders,
      message: `Missing expected headers: ${missingHeaders.join(', ')}`
    });
  }

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i;
    const values = parseCSVLine(lines[i]);

    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });

    try {
      const rawObservation = parseRawRecord(record, rowNumber);

      let observation = rawObservation;

      if (!skipValidation) {
        const validationResult = validateObservation(rawObservation);
        observation = { ...observation, ...validationResult };

        if (validationResult.validationErrors?.length > 0) {
          errors.push({
            rowNumber,
            errors: validationResult.validationErrors
          });
        }
      }

      if (!skipNormalisation) {
        observation = normaliseObservation(observation);
      }

      records.push(observation);
    } catch (err) {
      errors.push({
        rowNumber,
        errors: [{ field: 'row', message: err.message }]
      });
    }
  }

  return {
    records,
    summary: generateSummary(records),
    errors,
    warnings
  };
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

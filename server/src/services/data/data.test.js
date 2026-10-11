/**
 * Tests for data ingestion, validation, and normalisation services
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { importCsvSync } from './csvImport.service.js';
import {
  validateObservation,
  isValidForCalculation,
  isMissing,
  isBDL,
  isND,
  isQualified
} from './validation.service.js';
import {
  normaliseObservation,
  getCanonicalGhatId,
  getGhatDisplayName,
  groupByGhat
} from './normalisation.service.js';

describe('CSV Import Service', () => {
  it('should parse valid CSV content', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,pH,7.5,,,7.5,pH,Khatlapura,high,26`;

    const result = importCsvSync(csv);

    assert.strictEqual(result.records.length, 1);
    assert.strictEqual(result.summary.totalRecords, 1);
    assert.strictEqual(result.records[0].parameter, 'pH');
    assert.strictEqual(result.records[0].numericValue, 7.5);
  });

  it('should handle empty cells as missing', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,Chromium,,mg/l,not sampled,_,Chromium,Khatlapura,high,26`;

    const result = importCsvSync(csv);

    assert.strictEqual(result.records[0].validationStatus, 'missing');
    assert.strictEqual(result.records[0].qualifier, 'missing');
    assert.strictEqual(result.records[0].numericValue, null);
  });

  it('should preserve BDL flag and not convert to zero', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,Chromium,,mg/l,BDL,BDL,Chromium,Khatlapura,high,26`;

    const result = importCsvSync(csv);

    assert.strictEqual(result.records[0].validationStatus, 'qualified');
    assert.strictEqual(result.records[0].qualifier, 'BDL');
    assert.strictEqual(result.records[0].numericValue, null);
    assert.notStrictEqual(result.records[0].numericValue, 0);
  });

  it('should count BDL, missing, and valid records correctly', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,pH,7.5,,,7.5,pH,Khatlapura,high,26
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,Chromium,,mg/l,BDL,BDL,Chromium,Khatlapura,high,26
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,Lead,,mg/l,not sampled,_,Lead,Khatlapura,high,26`;

    const result = importCsvSync(csv);

    assert.strictEqual(result.summary.totalRecords, 3);
    assert.strictEqual(result.summary.validNumericCount, 1);
    assert.strictEqual(result.summary.bdlCount, 1);
    assert.strictEqual(result.summary.missingCount, 1);
  });

  it('should handle quoted fields with commas', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,"Rani Kamlapati ghat / Kamla Park kund",Lower Lake,pre,pH,7.5,,,7.5,pH,"Kamla Park, Bhopal",medium,26`;

    const result = importCsvSync(csv);

    assert.strictEqual(result.records[0].site, 'Rani Kamlapati ghat / Kamla Park kund');
    assert.strictEqual(result.records[0].siteAsPrinted, 'Kamla Park, Bhopal');
  });

  it('should report missing expected headers as warnings', () => {
    const csv = `year,site,parameter,value
2023,Khatlapura ghat,pH,7.5`;

    const result = importCsvSync(csv);

    assert.ok(result.warnings.length > 0);
    assert.strictEqual(result.warnings[0].type, 'missing_headers');
  });
});

describe('Validation Service', () => {
  it('should validate numeric values correctly', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'pH',
      year: '2023',
      rawValue: '7.5'
    };

    const result = validateObservation(obs);

    assert.strictEqual(result.validationStatus, 'valid');
    assert.strictEqual(result.numericValue, 7.5);
    assert.strictEqual(result.qualifier, null);
  });

  it('should mark empty values as missing, not zero', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'Chromium',
      year: '2023',
      rawValue: '',
      flag: 'not sampled'
    };

    const result = validateObservation(obs);

    assert.strictEqual(result.validationStatus, 'missing');
    assert.strictEqual(result.numericValue, null);
    assert.notStrictEqual(result.numericValue, 0);
  });

  it('should preserve BDL qualifier', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'Lead',
      year: '2023',
      rawValue: '',
      flag: 'BDL'
    };

    const result = validateObservation(obs);

    assert.strictEqual(result.validationStatus, 'qualified');
    assert.strictEqual(result.qualifier, 'BDL');
    assert.strictEqual(result.numericValue, null);
  });

  it('should preserve ND qualifier', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'Copper',
      year: '2023',
      rawValue: 'ND',
      valueAsPrinted: 'ND'
    };

    const result = validateObservation(obs);

    assert.strictEqual(result.validationStatus, 'qualified');
    assert.strictEqual(result.qualifier, 'ND');
  });

  it('should mark invalid numeric values', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'pH',
      year: '2023',
      rawValue: 'abc'
    };

    const result = validateObservation(obs);

    assert.strictEqual(result.validationStatus, 'invalid');
    assert.strictEqual(result.numericValue, null);
  });

  it('should handle asterisk flags as missing', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'Zinc',
      year: '2023',
      rawValue: '',
      flag: '*'
    };

    const result = validateObservation(obs);

    assert.strictEqual(result.validationStatus, 'missing');
  });

  it('should validate year ranges', () => {
    const invalidYear = {
      site: 'Khatlapura ghat',
      parameter: 'pH',
      year: '1800',
      rawValue: '7.5'
    };

    const result = validateObservation(invalidYear);

    assert.ok(result.validationErrors?.some(e => e.field === 'year'));
  });

  it('should warn on medium site match confidence', () => {
    const obs = {
      site: 'Rani Kamlapati ghat / Kamla Park kund',
      parameter: 'pH',
      year: '2023',
      rawValue: '7.5',
      siteMatchConfidence: 'medium'
    };

    const result = validateObservation(obs);

    assert.ok(result.validationErrors?.some(e =>
      e.field === 'site' && e.severity === 'warning'
    ));
  });
});

describe('Validation Helper Functions', () => {
  it('isValidForCalculation should return true only for valid numeric', () => {
    assert.strictEqual(isValidForCalculation({ validationStatus: 'valid', numericValue: 7.5 }), true);
    assert.strictEqual(isValidForCalculation({ validationStatus: 'valid', numericValue: null }), false);
    assert.strictEqual(isValidForCalculation({ validationStatus: 'missing', numericValue: null }), false);
    assert.strictEqual(isValidForCalculation({ validationStatus: 'qualified', numericValue: null }), false);
  });

  it('isMissing should identify missing observations', () => {
    assert.strictEqual(isMissing({ validationStatus: 'missing' }), true);
    assert.strictEqual(isMissing({ qualifier: 'missing' }), true);
    assert.strictEqual(isMissing({ validationStatus: 'valid', numericValue: 7.5 }), false);
  });

  it('isBDL should identify BDL observations', () => {
    assert.strictEqual(isBDL({ qualifier: 'BDL' }), true);
    assert.strictEqual(isBDL({ qualifier: 'ND' }), false);
    assert.strictEqual(isBDL({ qualifier: null }), false);
  });

  it('isND should identify ND observations', () => {
    assert.strictEqual(isND({ qualifier: 'ND' }), true);
    assert.strictEqual(isND({ qualifier: 'BDL' }), false);
  });

  it('isQualified should identify qualified observations', () => {
    assert.strictEqual(isQualified({ validationStatus: 'qualified', qualifier: 'BDL' }), true);
    assert.strictEqual(isQualified({ qualifier: 'ND' }), true);
    assert.ok(!isQualified({ validationStatus: 'valid', qualifier: null }));
  });
});

describe('Normalisation Service', () => {
  it('should generate canonical ghat IDs', () => {
    assert.strictEqual(getCanonicalGhatId('Khatlapura ghat'), 'khatlapura-ghat');
    assert.strictEqual(getCanonicalGhatId('Bairagarh (Sant Hirdaram) kund'), 'bairagarh-sant-hirdaram-kund');
    assert.strictEqual(getCanonicalGhatId('Rani Kamlapati ghat / Kamla Park kund'), 'rani-kamlapati-ghat');
  });

  it('should preserve display names', () => {
    assert.strictEqual(getGhatDisplayName('khatlapura-ghat'), 'Khatlapura ghat');
    assert.strictEqual(getGhatDisplayName('bairagarh-sant-hirdaram-kund'), 'Bairagarh (Sant Hirdaram) kund');
  });

  it('should normalise observations with all fields', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'Dissolved oxygen',
      year: '2023',
      festival: 'Ganesh',
      phase: 'pre',
      numericValue: 6.4,
      validationStatus: 'valid'
    };

    const normalised = normaliseObservation(obs);

    assert.strictEqual(normalised.ghatId, 'khatlapura-ghat');
    assert.strictEqual(normalised.parameterId, 'dissolved_oxygen');
    assert.strictEqual(normalised.yearNumeric, 2023);
    assert.ok(normalised.observationId);
    assert.ok(normalised.sourceId);
  });

  it('should group observations by ghat', () => {
    const observations = [
      { ghatId: 'khatlapura-ghat', parameter: 'pH' },
      { ghatId: 'khatlapura-ghat', parameter: 'BOD' },
      { ghatId: 'prempura-ghat', parameter: 'pH' }
    ];

    const groups = groupByGhat(observations);

    assert.strictEqual(Object.keys(groups).length, 2);
    assert.strictEqual(groups['khatlapura-ghat'].observations.length, 2);
    assert.strictEqual(groups['prempura-ghat'].observations.length, 1);
  });

  it('should handle null site gracefully', () => {
    assert.strictEqual(getCanonicalGhatId(null), null);
    assert.strictEqual(getCanonicalGhatId(undefined), null);
  });

  it('should handle invalid year', () => {
    const obs = {
      site: 'Khatlapura ghat',
      parameter: 'pH',
      year: 'invalid',
      numericValue: 7.5
    };

    const normalised = normaliseObservation(obs);

    assert.strictEqual(normalised.yearNumeric, null);
  });
});

describe('Data Quality Rules', () => {
  it('missing values must never be treated as zero', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,Chromium,,mg/l,not sampled,_,Chromium,Khatlapura,high,26`;

    const result = importCsvSync(csv);
    const record = result.records[0];

    assert.strictEqual(record.numericValue, null);
    assert.notStrictEqual(record.numericValue, 0);
    assert.strictEqual(isMissing(record), true);
    assert.strictEqual(isValidForCalculation(record), false);
  });

  it('BDL values must not be converted to zero', () => {
    const csv = `year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page
2023,Ganesh,Khatlapura ghat,Lower Lake,pre,Lead,,mg/l,BDL,BDL,Lead,Khatlapura,high,26`;

    const result = importCsvSync(csv);
    const record = result.records[0];

    assert.strictEqual(record.numericValue, null);
    assert.notStrictEqual(record.numericValue, 0);
    assert.strictEqual(record.qualifier, 'BDL');
    assert.strictEqual(isBDL(record), true);
    assert.strictEqual(isValidForCalculation(record), false);
  });

  it('ND values must be preserved separately from BDL', () => {
    const obsND = validateObservation({
      site: 'Test',
      parameter: 'Copper',
      year: '2023',
      rawValue: 'ND'
    });

    const obsBDL = validateObservation({
      site: 'Test',
      parameter: 'Copper',
      year: '2023',
      flag: 'BDL'
    });

    assert.strictEqual(obsND.qualifier, 'ND');
    assert.strictEqual(obsBDL.qualifier, 'BDL');
    assert.notStrictEqual(obsND.qualifier, obsBDL.qualifier);
  });
});

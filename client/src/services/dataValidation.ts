import type {
  RawCsvRecord,
  Measurement,
  MeasurementStatus,
  SiteMatchConfidence,
} from '../types';
import { evaluateThreshold } from './thresholdRules';

export const OFFICIAL_REPORT_SOURCES: Record<
  number,
  { title: string; totalPages: number; url: string; date: string }
> = {
  2025: {
    title: 'MPPCB Ganesh and Durga Visarjan Report 2025',
    totalPages: 92,
    url: 'https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2025.pdf',
    date: 'October 2025',
  },
  2024: {
    title: 'MPPCB Ganesh and Durga Visarjan Report 2024',
    totalPages: 118,
    url: 'https://www.mppcb.mp.gov.in/proc/mon/Ganesh_and_Durga_visarjan_report-2024.pdf',
    date: 'October 2024',
  },
  2023: {
    title: 'MPPCB Idol Immersion Report 2023 (CPCB format)',
    totalPages: 87,
    url: 'https://www.mppcb.mp.gov.in/proc/mon/Idol_immer._Report_23_CPCB.pdf',
    date: 'October 2023',
  },
};

export const CPCB_CRITERIA_SOURCE = {
  title: 'CPCB Designated Best Use Water Quality Criteria',
  url: 'https://cpcb.gov.in/water-quality-criteria/',
  description: 'Official Class B bathing water thresholds established by Central Pollution Control Board.',
};

export const NGT_ORDER_SOURCE = {
  title: 'NGT Immersion Ban & BMC Dedicated Kunds Directive',
  url: 'https://www.freepressjournal.in/amp/bhopal/mp-news-idol-immersion-to-shift-from-lakes-to-safer-sites-ngt-ban-pushes-bmc-to-build-4-dedicated-ghats',
  description: 'Order restricting direct lake immersion to protect Bhopal lakes and directing BMC artificial immersion kunds.',
};

/**
 * Validates and transforms a raw CSV record into a strongly-typed Measurement.
 * Enforces mandatory data rules:
 * - Missing is not clean.
 * - Missing is not zero.
 * - BDL and ND are not zero.
 * - Unparseable values are marked invalid and never treated as passing.
 */
export function parseAndValidateRecord(raw: RawCsvRecord, index: number): Measurement {
  const yearNum = parseInt(raw.year, 10) || 0;
  const pageNum = raw.source_page ? parseInt(raw.source_page, 10) || null : null;

  const rawVal = (raw.value ?? '').trim();
  const rawFlag = (raw.flag ?? '').trim().toLowerCase();
  const valPrinted = (raw.value_as_printed ?? '').trim();

  let status: MeasurementStatus = 'invalid';
  let numericValue: number | null = null;

  if (rawFlag === 'bdl' || valPrinted.toUpperCase() === 'BDL') {
    status = 'bdl';
    numericValue = null;
  } else if (rawFlag === 'nd' || valPrinted.toUpperCase() === 'ND') {
    status = 'nd';
    numericValue = null;
  } else if (
    rawFlag === 'not sampled' ||
    valPrinted === '_' ||
    valPrinted === '-' ||
    valPrinted === '*' ||
    valPrinted === '**' ||
    rawFlag === '*' ||
    rawFlag === '**'
  ) {
    status = 'not_sampled';
    numericValue = null;
  } else if (rawVal !== '' && !isNaN(Number(rawVal))) {
    numericValue = Number(rawVal);
    status = 'valid_numeric';
  } else if (valPrinted === '' && rawVal === '') {
    status = 'not_sampled';
    numericValue = null;
  } else {
    status = 'invalid';
    numericValue = null;
  }

  // Determine site match confidence
  const confRaw = (raw.site_match_confidence ?? '').trim().toLowerCase();
  const siteMatchConfidence: SiteMatchConfidence =
    confRaw === 'medium' ? 'medium' : 'high';

  // Evaluate threshold deterministically
  const comparison = evaluateThreshold(raw.parameter, numericValue, raw.flag);

  // Link to source report
  const report = OFFICIAL_REPORT_SOURCES[yearNum] || {
    title: `MPPCB Immersion Monitoring Report ${yearNum}`,
    totalPages: 0,
    url: '',
    date: `${yearNum}`,
  };

  const id = `rec-${yearNum}-${raw.festival}-${raw.site}-${raw.phase}-${raw.parameter}-${index}`
    .replace(/[^a-zA-Z0-9-]/g, '_')
    .toLowerCase();

  return {
    id,
    year: yearNum,
    festival: raw.festival,
    site: raw.site,
    waterBody: raw.water_body,
    phase: raw.phase as 'pre' | 'during' | 'after',
    parameter: raw.parameter,
    numericValue,
    unit: raw.unit_assumed || '',
    status,
    flag: raw.flag || '',
    valueAsPrinted: raw.value_as_printed || '',
    parameterAsPrinted: raw.parameter_as_printed || raw.parameter,
    siteAsPrinted: raw.site_as_printed || raw.site,
    siteMatchConfidence,
    sourcePage: pageNum,
    comparison,
    sourceReportTitle: report.title,
    sourceReportUrl: report.url,
    raw,
  };
}

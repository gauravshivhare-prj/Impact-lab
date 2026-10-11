import type { Measurement, GhatPriority, DataQualityIssue, RawCsvRecord } from '../types';
import { BHOPAL_GHATS_RAW_DATA } from '../data/bhopalGhatsRawData';
import { parseAndValidateRecord, OFFICIAL_REPORT_SOURCES, CPCB_CRITERIA_SOURCE, NGT_ORDER_SOURCE } from './dataValidation';
import { rankAllSites, extractDataQualityIssues, type FilterOptions } from './analysisService';

class DataService {
  private measurements: Measurement[] = [];
  private isLoaded = false;
  private loadError: string | null = null;

  constructor() {
    this.initializeData();
  }

  public isDataReady(): boolean {
    return this.isLoaded;
  }

  public getLoadError(): string | null {
    return this.loadError;
  }

  private initializeData(): void {
    try {
      this.measurements = BHOPAL_GHATS_RAW_DATA.map((raw: RawCsvRecord, index: number) =>
        parseAndValidateRecord(raw, index)
      );
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to initialize raw dataset:', err);
      this.loadError = err instanceof Error ? err.message : 'Unknown data loading error';
    }
  }

  /**
   * Optionally attempts to fetch the live CSV file from public storage.
   * If successful and parsed, updates cache; otherwise seamlessly preserves pre-compiled data.
   */
  public async loadFromRemoteCsv(): Promise<void> {
    try {
      const response = await fetch('/data/bhopal_ghats_2023_2025.csv');
      if (!response.ok) return;
      const text = await response.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const parsedRecords: RawCsvRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cols: string[] = [];
        let inQuotes = false;
        let cur = '';
        for (let c = 0; c < line.length; c++) {
          const ch = line[c];
          if (ch === '"') {
            inQuotes = !inQuotes;
          } else if (ch === ',' && !inQuotes) {
            cols.push(cur);
            cur = '';
          } else {
            cur += ch;
          }
        }
        cols.push(cur);
        const obj: Record<string, string> = {};
        header.forEach((h, idx) => {
          obj[h] = cols[idx] ? cols[idx].trim().replace(/^"|"$/g, '') : '';
        });
        parsedRecords.push(obj as unknown as RawCsvRecord);
      }

      if (parsedRecords.length > 0) {
        this.measurements = parsedRecords.map((raw, idx) => parseAndValidateRecord(raw, idx));
      }
    } catch {
      // Keep embedded dataset fallback without interruption
    }
  }

  public getAllMeasurements(): Measurement[] {
    return this.measurements;
  }

  public getFilteredMeasurements(filters: FilterOptions): Measurement[] {
    return this.measurements.filter((m) => {
      if (filters.year && filters.year !== 'all' && m.year.toString() !== filters.year) {
        return false;
      }
      if (filters.festival && filters.festival !== 'all' && m.festival.toLowerCase() !== filters.festival.toLowerCase()) {
        return false;
      }
      if (filters.phase && filters.phase !== 'all' && m.phase.toLowerCase() !== filters.phase.toLowerCase()) {
        return false;
      }
      if (filters.parameter && filters.parameter !== 'all' && m.parameter !== filters.parameter) {
        return false;
      }
      if (filters.confidence && filters.confidence !== 'all' && m.siteMatchConfidence !== filters.confidence) {
        return false;
      }
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase();
        const matchesSite = m.site.toLowerCase().includes(q) || m.siteAsPrinted.toLowerCase().includes(q);
        const matchesParam = m.parameter.toLowerCase().includes(q);
        const matchesVal = (m.numericValue?.toString() || '').includes(q) || m.valueAsPrinted.toLowerCase().includes(q);
        if (!matchesSite && !matchesParam && !matchesVal) return false;
      }
      return true;
    });
  }

  public getSiteRankings(filters: FilterOptions = {}): GhatPriority[] {
    const filtered = this.getFilteredMeasurements(filters);
    const rankings = rankAllSites(filtered, this.measurements);

    if (filters.priority && filters.priority !== 'all') {
      return rankings.filter((r) => r.priority === filters.priority);
    }
    return rankings;
  }

  public getGhatDetails(siteName: string, filters: FilterOptions = {}): GhatPriority | null {
    const rankings = this.getSiteRankings(filters);
    return rankings.find((r) => r.site.toLowerCase() === siteName.toLowerCase()) || null;
  }

  public getMeasurementsForSite(siteName: string): Measurement[] {
    return this.measurements.filter((m) => m.site.toLowerCase() === siteName.toLowerCase());
  }

  public getDataQualityIssues(): DataQualityIssue[] {
    return extractDataQualityIssues(this.measurements);
  }

  public getOverviewMetrics() {
    const totalRecords = this.measurements.length;
    const sites = new Set(this.measurements.map((m) => m.site));
    const validNumericCount = this.measurements.filter((m) => m.status === 'valid_numeric').length;
    const nonNumericCount = totalRecords - validNumericCount;
    const mediumConfCount = this.measurements.filter((m) => m.siteMatchConfidence === 'medium').length;
    const zeroDOCount = this.measurements.filter(
      (m) => m.parameter === 'Dissolved oxygen' && m.numericValue === 0
    ).length;

    return {
      totalGhats: sites.size,
      totalRecords,
      validNumericMeasurements: validNumericCount,
      nonNumericOrFlagged: nonNumericCount,
      mediumConfidenceRecords: mediumConfCount,
      zeroDOCount,
      yearsCovered: '2023–2025',
    };
  }

  public getOfficialSources() {
    return {
      reports: OFFICIAL_REPORT_SOURCES,
      cpcb: CPCB_CRITERIA_SOURCE,
      ngt: NGT_ORDER_SOURCE,
    };
  }

  public exportMeasurementsToCsv(measurements: Measurement[], filename = 'ghatwatch_measurements.csv'): void {
    const headers = [
      'Site',
      'Water Body',
      'Year',
      'Festival',
      'Phase',
      'Parameter',
      'Value (Parsed)',
      'Unit',
      'Value (As Printed)',
      'Status',
      'Flag',
      'Threshold Comparison',
      'Site Printed Name',
      'Site Match Confidence',
      'Source Page',
      'Source Report Title',
      'Source Report URL',
    ];

    const rows = measurements.map((m) => [
      `"${m.site}"`,
      `"${m.waterBody}"`,
      m.year,
      `"${m.festival}"`,
      `"${m.phase}"`,
      `"${m.parameter}"`,
      m.numericValue ?? '',
      `"${m.unit}"`,
      `"${m.valueAsPrinted}"`,
      `"${m.status}"`,
      `"${m.flag}"`,
      `"${m.comparison.status}: ${m.comparison.thresholdLabel}"`,
      `"${m.siteAsPrinted}"`,
      `"${m.siteMatchConfidence}"`,
      m.sourcePage ?? '',
      `"${m.sourceReportTitle}"`,
      `"${m.sourceReportUrl}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const dataService = new DataService();

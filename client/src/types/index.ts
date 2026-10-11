export type Festival = 'Ganesh' | 'Durga' | string;
export type Phase = 'pre' | 'during' | 'after' | string;
export type SiteMatchConfidence = 'high' | 'medium';

export interface RawCsvRecord {
  year: string;
  festival: string;
  site: string;
  water_body: string;
  phase: string;
  parameter: string;
  value: string;
  unit_assumed: string;
  flag: string;
  value_as_printed: string;
  parameter_as_printed: string;
  site_as_printed: string;
  site_match_confidence: string;
  source_page: string;
}

export type MeasurementStatus =
  | 'valid_numeric'
  | 'bdl'           // Below detection limit
  | 'nd'            // Not detected
  | 'not_sampled'   // Blank, _, -
  | 'invalid';      // Unparseable

export type ComparisonStatus = 'pass' | 'exceed' | 'unassessed' | 'non_numeric';

export interface ThresholdComparison {
  status: ComparisonStatus;
  thresholdLabel: string;
  message: string;
  isViolation: boolean;
}

export interface Measurement {
  id: string;
  year: number;
  festival: string;
  site: string;
  waterBody: string;
  phase: 'pre' | 'during' | 'after';
  parameter: string;
  numericValue: number | null;
  unit: string;
  status: MeasurementStatus;
  flag: string;
  valueAsPrinted: string;
  parameterAsPrinted: string;
  siteAsPrinted: string;
  siteMatchConfidence: SiteMatchConfidence;
  sourcePage: number | null;
  comparison: ThresholdComparison;
  sourceReportTitle: string;
  sourceReportUrl: string;
  raw: RawCsvRecord;
}

export interface ThresholdRule {
  parameter: string;
  unit: string;
  standardName: string;
  cpcbClass: string;
  minValue?: number;
  maxValue?: number;
  conditionDescription: string;
  rationale: string;
}

export type PriorityLevel =
  | 'high'
  | 'medium'
  | 'lower'
  | 'insufficient_evidence';

export interface ParameterStats {
  parameter: string;
  unit: string;
  validCount: number;
  totalRecords: number;
  min: number | null;
  max: number | null;
  avg: number | null;
  exceedanceCount: number;
  exceedancePercentage: number;
  bdlCount: number;
  ndCount: number;
  notSampledCount: number;
  thresholdDescription: string;
  hasConfiguredThreshold: boolean;
}

export interface GhatPriority {
  rank: number;
  site: string;
  waterBody: string;
  confidence: SiteMatchConfidence;
  priority: PriorityLevel;
  primaryReason: string;
  secondaryReasons: string[];
  totalRecords: number;
  validNumericCount: number;
  parameterStats: Record<string, ParameterStats>;
  doExceedanceRate: number; // percentage
  bodExceedanceRate: number; // percentage
  phExceedanceRate: number; // percentage
  zeroDOCount: number;
  coverageWarnings: string[];
  latestYear: number;
  yearsCovered: number[];
  durga2025Missing: boolean;
  scoringBreakdown: {
    zeroDOPenalty: number;
    doExceedanceScore: number;
    bodExceedanceScore: number;
    confidenceAdjustment: number;
    coverageAdjustment: number;
    totalScore: number;
  };
}

export interface DataQualityIssue {
  id: string;
  type:
    | 'missing_value'
    | 'bdl'
    | 'nd'
    | 'not_sampled'
    | 'medium_confidence'
    | 'low_coverage'
    | 'missing_source'
    | 'zero_reading';
  severity: 'info' | 'warning' | 'alert';
  site: string;
  year: number;
  parameter: string;
  phase: string;
  festival: string;
  description: string;
  record: Measurement;
}

export interface BriefingRequest {
  language: 'en' | 'hi' | 'both';
  year: string;
  festival: string;
  selectedSites: string[];
  includeSourceReferences: boolean;
  includeDataQualityCaveats: boolean;
  customNotes?: string;
}

export interface BriefingGhatItem {
  rank: number;
  site: string;
  waterBody: string;
  priority: PriorityLevel;
  reasonEn: string;
  reasonHi: string;
  statsSummary: string;
  recommendedActionEn: string;
  recommendedActionHi: string;
  sources: { title: string; page: number | null; url: string }[];
}

export interface BriefingResult {
  generatedAt: string;
  language: 'en' | 'hi' | 'both';
  reportingPeriod: string;
  executiveSummaryEn: string;
  executiveSummaryHi: string;
  ghats: BriefingGhatItem[];
  dataQualityCaveatEn: string;
  dataQualityCaveatHi: string;
  statutoryNoticeEn: string;
  statutoryNoticeHi: string;
  sourceReferences: {
    title: string;
    url: string;
    description: string;
  }[];
}

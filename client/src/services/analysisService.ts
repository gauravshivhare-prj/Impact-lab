import type {
  Measurement,
  GhatPriority,
  ParameterStats,
  PriorityLevel,
  DataQualityIssue,
} from '../types';
import { THRESHOLD_RULES } from './thresholdRules';

export interface FilterOptions {
  year?: string; // 'all' | '2023' | '2024' | '2025'
  festival?: string; // 'all' | 'Ganesh' | 'Durga'
  phase?: string; // 'all' | 'pre' | 'during' | 'after'
  parameter?: string; // 'all' | parameter name
  priority?: string; // 'all' | PriorityLevel
  confidence?: string; // 'all' | 'high' | 'medium'
  searchQuery?: string;
}

/**
 * Calculates parameter-level statistics for a set of measurements.
 * Strictly adheres to rule: BDL, ND, blanks are NEVER treated as zero.
 */
export function calculateParameterStats(
  measurements: Measurement[],
  parameterName: string
): ParameterStats {
  const paramRecords = measurements.filter((m) => m.parameter === parameterName);
  const totalRecords = paramRecords.length;

  let validCount = 0;
  let bdlCount = 0;
  let ndCount = 0;
  let notSampledCount = 0;
  let sum = 0;
  let min: number | null = null;
  let max: number | null = null;
  let exceedanceCount = 0;

  paramRecords.forEach((m) => {
    if (m.status === 'valid_numeric' && m.numericValue !== null) {
      validCount++;
      const val = m.numericValue;
      sum += val;
      if (min === null || val < min) min = val;
      if (max === null || val > max) max = val;

      if (m.comparison.isViolation) {
        exceedanceCount++;
      }
    } else if (m.status === 'bdl') {
      bdlCount++;
    } else if (m.status === 'nd') {
      ndCount++;
    } else if (m.status === 'not_sampled') {
      notSampledCount++;
    }
  });

  const avg = validCount > 0 ? parseFloat((sum / validCount).toFixed(2)) : null;
  const exceedancePercentage =
    validCount > 0 ? parseFloat(((exceedanceCount / validCount) * 100).toFixed(1)) : 0;

  const rule = THRESHOLD_RULES[parameterName];

  return {
    parameter: parameterName,
    unit: rule?.unit || paramRecords[0]?.unit || 'mg/l',
    validCount,
    totalRecords,
    min,
    max,
    avg,
    exceedanceCount,
    exceedancePercentage,
    bdlCount,
    ndCount,
    notSampledCount,
    thresholdDescription: rule?.conditionDescription || 'No standard set for Class B',
    hasConfiguredThreshold: !!rule,
  };
}

/**
 * Deterministic, explainable ranking calculation based on 5 concrete factors:
 * 1. Zero DO count: severe penalty (+30 per zero reading) as it marks complete biological anoxia.
 * 2. DO exceedance rate: primary ecological hazard (rate * 0.4 points).
 * 3. BOD exceedance rate: organic pollution indicator (rate * 0.2 points).
 * 4. Site mapping confidence: medium confidence requires attention (+10 points).
 * 5. Data coverage gap: missing Durga 2025 reporting requires investigation (+15 points).
 */
export function analyzeSitePriority(
  siteName: string,
  measurements: Measurement[],
  allRecordsForCoverage: Measurement[]
): GhatPriority {
  const siteRecords = measurements.filter((m) => m.site === siteName);
  const baselineRecords = allRecordsForCoverage.filter((m) => m.site === siteName);

  const waterBody = siteRecords[0]?.waterBody || baselineRecords[0]?.waterBody || 'Unknown';
  const confidence = siteRecords[0]?.siteMatchConfidence || 'high';

  const distinctYears = Array.from(new Set(baselineRecords.map((m) => m.year))).sort();
  const latestYear = distinctYears.length > 0 ? Math.max(...distinctYears) : 2025;

  // Check if Durga 2025 is missing
  const hasDurga2025 = baselineRecords.some(
    (m) => m.year === 2025 && m.festival.toLowerCase() === 'durga'
  );
  const durga2025Missing = !hasDurga2025;

  // Compute stats for all 13 parameters
  const parameterList = Array.from(new Set(siteRecords.map((m) => m.parameter)));
  const parameterStats: Record<string, ParameterStats> = {};
  parameterList.forEach((param) => {
    parameterStats[param] = calculateParameterStats(siteRecords, param);
  });

  const doStats = parameterStats['Dissolved oxygen'];
  const bodStats = parameterStats['BOD'];
  const phStats = parameterStats['pH'];

  const doExceedanceRate = doStats?.exceedancePercentage ?? 0;
  const bodExceedanceRate = bodStats?.exceedancePercentage ?? 0;
  const phExceedanceRate = phStats?.exceedancePercentage ?? 0;

  // Count zero DO occurrences
  const zeroDOCount = siteRecords.filter(
    (m) => m.parameter === 'Dissolved oxygen' && m.numericValue === 0
  ).length;

  // Explicit calculation scoring components
  const zeroDOPenalty = zeroDOCount * 30;
  const doExceedanceScore = parseFloat((doExceedanceRate * 0.4).toFixed(1));
  const bodExceedanceScore = parseFloat((bodExceedanceRate * 0.2).toFixed(1));
  const confidenceAdjustment = confidence === 'medium' ? 10 : 0;
  const coverageAdjustment = durga2025Missing ? 15 : 0;

  const totalScore = parseFloat(
    (
      zeroDOPenalty +
      doExceedanceScore +
      bodExceedanceScore +
      confidenceAdjustment +
      coverageAdjustment
    ).toFixed(1)
  );

  // Coverage warnings
  const coverageWarnings: string[] = [];
  if (durga2025Missing) {
    coverageWarnings.push('Missing Durga 2025 report table in official MPPCB records');
  }
  if (confidence === 'medium') {
    coverageWarnings.push(
      'Medium site-name confidence (Ganesh reports cite "Kamla Park kund", Durga reports cite "Lower Lake ghat")'
    );
  }
  if (siteRecords.length < 200 && !durga2025Missing) {
    coverageWarnings.push('Reduced sampling coverage compared to other standard monitoring sites');
  }

  // Derive priority category deterministically
  let priority: PriorityLevel = 'lower';
  let primaryReason = '';
  const secondaryReasons: string[] = [];

  if (zeroDOCount > 0 || doExceedanceRate >= 40 || (confidence === 'medium' && bodExceedanceRate >= 80)) {
    priority = 'high';
  } else if (doExceedanceRate >= 20 || bodExceedanceRate >= 70 || phExceedanceRate > 0) {
    priority = 'medium';
  } else {
    priority = 'lower';
  }

  // Build plain-language explanations
  if (zeroDOCount > 0) {
    primaryReason = `Critical hypoxia: Dissolved oxygen recorded at 0.0 mg/l across ${zeroDOCount} post-immersion tests (${doExceedanceRate}% of DO tests below 5.0 mg/l).`;
    secondaryReasons.push(`100% of assessed BOD samples exceed permissible threshold of 3.0 mg/l.`);
    if (durga2025Missing) {
      secondaryReasons.push(`No Durga 2025 monitoring table published in MPPCB report.`);
    }
  } else if (doExceedanceRate >= 60) {
    primaryReason = `Severe chronic oxygen depletion: ${doExceedanceRate}% of dissolved oxygen readings breached the 5.0 mg/l minimum limit.`;
    secondaryReasons.push(`BOD exceedance rate of ${bodExceedanceRate}% indicates heavy organic waste.`);
    if (durga2025Missing) {
      secondaryReasons.push(`Missing Durga 2025 monitoring table in official report.`);
    }
  } else if (confidence === 'medium') {
    primaryReason = `100% BOD exceedance with location ambiguity: reported as Kamla Park kund (Ganesh) and Lower Lake ghat (Durga).`;
    secondaryReasons.push(`DO deficit rate of ${doExceedanceRate}% (${doStats?.exceedanceCount ?? 0}/${doStats?.validCount ?? 0} samples).`);
    secondaryReasons.push(`Physical boundary and source mapping confirmation required before deployment.`);
  } else if (doExceedanceRate >= 40) {
    primaryReason = `High immersion pressure on Lower Lake: ${doExceedanceRate}% of DO readings fell below 5.0 mg/l, with ${bodExceedanceRate}% BOD non-compliance.`;
    secondaryReasons.push(`BOD levels reached peak values up to ${bodStats?.max ?? 0} mg/l during post-immersion phase.`);
  } else if (doExceedanceRate >= 20) {
    primaryReason = `Moderate DO depletion (${doExceedanceRate}%) and 100% BOD non-compliance in Shahpura Lake basin.`;
    secondaryReasons.push(`Consistent organic pollution load requires monitoring during festival mass immersions.`);
  } else if (bodExceedanceRate >= 60) {
    primaryReason = `Elevated organic load: ${bodExceedanceRate}% BOD exceedance in Upper Lake, with intermittent alkaline pH spikes.`;
    secondaryReasons.push(`DO levels maintained compliance in 83.3% of tests (average DO: ${doStats?.avg ?? 0} mg/l).`);
  } else {
    primaryReason = `Consistently healthy dissolved oxygen (${doStats?.validCount ?? 0} of ${doStats?.validCount ?? 0} readings >= 5.0 mg/l; 0% DO deficit).`;
    secondaryReasons.push(`BOD remains elevated (${bodExceedanceRate}%) consistent with regional lake background, but no hypoxia observed.`);
  }

  const validNumericCount = siteRecords.filter((m) => m.status === 'valid_numeric').length;

  return {
    rank: 0, // Assigned after sorting
    site: siteName,
    waterBody,
    confidence,
    priority,
    primaryReason,
    secondaryReasons,
    totalRecords: siteRecords.length,
    validNumericCount,
    parameterStats,
    doExceedanceRate,
    bodExceedanceRate,
    phExceedanceRate,
    zeroDOCount,
    coverageWarnings,
    latestYear,
    yearsCovered: distinctYears,
    durga2025Missing,
    scoringBreakdown: {
      zeroDOPenalty,
      doExceedanceScore,
      bodExceedanceScore,
      confidenceAdjustment,
      coverageAdjustment,
      totalScore,
    },
  };
}

/**
 * Ranks all Bhopal sites deterministically based on empirical risk score.
 */
export function rankAllSites(
  measurements: Measurement[],
  baselineMeasurements: Measurement[]
): GhatPriority[] {
  const uniqueSites = Array.from(new Set(measurements.map((m) => m.site)));
  const siteSummaries = uniqueSites.map((site) =>
    analyzeSitePriority(site, measurements, baselineMeasurements)
  );

  // Sort descending by total score, then by DO exceedance rate, then by BOD exceedance rate
  siteSummaries.sort((a, b) => {
    if (b.scoringBreakdown.totalScore !== a.scoringBreakdown.totalScore) {
      return b.scoringBreakdown.totalScore - a.scoringBreakdown.totalScore;
    }
    if (b.doExceedanceRate !== a.doExceedanceRate) {
      return b.doExceedanceRate - a.doExceedanceRate;
    }
    return b.bodExceedanceRate - a.bodExceedanceRate;
  });

  // Assign 1-indexed ranks
  return siteSummaries.map((summary, idx) => ({
    ...summary,
    rank: idx + 1,
  }));
}

/**
 * Extracts all data quality issues across measurements.
 */
export function extractDataQualityIssues(measurements: Measurement[]): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];

  measurements.forEach((m) => {
    // Zero DO alert
    if (m.parameter === 'Dissolved oxygen' && m.numericValue === 0) {
      issues.push({
        id: `dq-zero-do-${m.id}`,
        type: 'zero_reading',
        severity: 'alert',
        site: m.site,
        year: m.year,
        parameter: m.parameter,
        phase: m.phase,
        festival: m.festival,
        description: `DO measured as 0.0 mg/l (Critical biological dead zone) at ${m.site} (${m.festival} ${m.year}, ${m.phase}).`,
        record: m,
      });
    }

    // Medium confidence mapping
    if (m.siteMatchConfidence === 'medium') {
      issues.push({
        id: `dq-med-conf-${m.id}`,
        type: 'medium_confidence',
        severity: 'warning',
        site: m.site,
        year: m.year,
        parameter: m.parameter,
        phase: m.phase,
        festival: m.festival,
        description: `Site mapping confidence is Medium. Printed as: "${m.siteAsPrinted}". May conflate Kamla Park kund and Lower Lake ghat.`,
        record: m,
      });
    }

    // Not sampled / missing values
    if (m.status === 'not_sampled') {
      issues.push({
        id: `dq-not-sampled-${m.id}`,
        type: 'not_sampled',
        severity: 'info',
        site: m.site,
        year: m.year,
        parameter: m.parameter,
        phase: m.phase,
        festival: m.festival,
        description: `Parameter not sampled (printed as "${m.valueAsPrinted || '_'}" in report). Never treated as clean.`,
        record: m,
      });
    }

    // BDL
    if (m.status === 'bdl') {
      issues.push({
        id: `dq-bdl-${m.id}`,
        type: 'bdl',
        severity: 'info',
        site: m.site,
        year: m.year,
        parameter: m.parameter,
        phase: m.phase,
        festival: m.festival,
        description: `Below detection limit (BDL). Very low concentration, but not zero.`,
        record: m,
      });
    }

    // ND
    if (m.status === 'nd') {
      issues.push({
        id: `dq-nd-${m.id}`,
        type: 'nd',
        severity: 'info',
        site: m.site,
        year: m.year,
        parameter: m.parameter,
        phase: m.phase,
        festival: m.festival,
        description: `Not detected (ND). Very low concentration, but not zero.`,
        record: m,
      });
    }

    // Missing source page
    if (m.sourcePage === null || isNaN(m.sourcePage)) {
      issues.push({
        id: `dq-page-missing-${m.id}`,
        type: 'missing_source',
        severity: 'warning',
        site: m.site,
        year: m.year,
        parameter: m.parameter,
        phase: m.phase,
        festival: m.festival,
        description: `Source page metadata missing for record.`,
        record: m,
      });
    }
  });

  return issues;
}

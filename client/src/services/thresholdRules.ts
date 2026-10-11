import type { ThresholdRule, ThresholdComparison } from '../types';

export const THRESHOLD_RULES: Record<string, ThresholdRule> = {
  'Dissolved oxygen': {
    parameter: 'Dissolved oxygen',
    unit: 'mg/l',
    standardName: 'CPCB Class B (Outdoor Bathing)',
    cpcbClass: 'Class B',
    minValue: 5.0,
    conditionDescription: 'Must be at least 5.0 mg/l',
    rationale:
      'Crucial for sustaining aquatic life and safe human contact. Values below 5.0 mg/l indicate hypoxia; zero DO indicates a severe biological dead zone.',
  },
  'BOD': {
    parameter: 'BOD',
    unit: 'mg/l',
    standardName: 'CPCB Class B (Outdoor Bathing)',
    cpcbClass: 'Class B',
    maxValue: 3.0,
    conditionDescription: 'Must be at most 3.0 mg/l (5 days at 20°C)',
    rationale:
      'Biochemical Oxygen Demand reflects organic pollution load. High BOD rapidly consumes dissolved oxygen and promotes microbial contamination.',
  },
  'pH': {
    parameter: 'pH',
    unit: '',
    standardName: 'CPCB Class B (Outdoor Bathing)',
    cpcbClass: 'Class B',
    minValue: 6.5,
    maxValue: 8.5,
    conditionDescription: 'Must fall between 6.5 and 8.5',
    rationale:
      'Measures acidity/alkalinity. Water outside 6.5–8.5 can cause skin/eye irritation and alters the toxicity of dissolved metals.',
  },
};

/**
 * Deterministically evaluates a numeric value against configured reference criteria.
 * Parameters without an explicit legal standard (COD, metals, solids, turbidity)
 * are marked as 'unassessed' with an explicit disclaimer.
 */
export function evaluateThreshold(
  parameter: string,
  numericValue: number | null,
  flag?: string
): ThresholdComparison {
  if (flag && flag.trim() !== '') {
    const cleanFlag = flag.trim();
    if (cleanFlag === 'BDL' || cleanFlag === 'ND') {
      return {
        status: 'non_numeric',
        thresholdLabel: 'Non-numeric reading',
        message: `${cleanFlag} (Below detection limit / Not detected) - very low, but not zero.`,
        isViolation: false,
      };
    }
    return {
      status: 'non_numeric',
      thresholdLabel: 'Unsampled',
      message: `Flagged as '${cleanFlag}'. Never treated as clean or compliant.`,
      isViolation: false,
    };
  }

  if (numericValue === null || isNaN(numericValue)) {
    return {
      status: 'non_numeric',
      thresholdLabel: 'No numeric measurement',
      message: 'Reading not available. Cannot evaluate against threshold.',
      isViolation: false,
    };
  }

  const rule = THRESHOLD_RULES[parameter];
  if (!rule) {
    return {
      status: 'unassessed',
      thresholdLabel: 'No standard set for Class B',
      message: 'No bathing-water standard configured for this parameter under CPCB Class B.',
      isViolation: false,
    };
  }

  // Parameter-specific evaluation
  if (parameter === 'Dissolved oxygen') {
    if (numericValue < (rule.minValue ?? 5.0)) {
      return {
        status: 'exceed',
        thresholdLabel: `< 5.0 mg/l (Deficit: ${(5.0 - numericValue).toFixed(1)} mg/l)`,
        message: numericValue === 0
          ? 'CRITICAL: Dissolved oxygen is 0.0 mg/l (Dead zone - fish mortality risk).'
          : `Deficient: ${numericValue} mg/l is below minimum threshold of 5.0 mg/l.`,
        isViolation: true,
      };
    }
    return {
      status: 'pass',
      thresholdLabel: '>= 5.0 mg/l',
      message: `Within threshold: ${numericValue} mg/l meets bathing standard.`,
      isViolation: false,
    };
  }

  if (parameter === 'BOD') {
    if (numericValue > (rule.maxValue ?? 3.0)) {
      return {
        status: 'exceed',
        thresholdLabel: `> 3.0 mg/l (+${(numericValue - 3.0).toFixed(1)} mg/l excess)`,
        message: `Exceedance: ${numericValue} mg/l exceeds maximum limit of 3.0 mg/l.`,
        isViolation: true,
      };
    }
    return {
      status: 'pass',
      thresholdLabel: '<= 3.0 mg/l',
      message: `Within threshold: ${numericValue} mg/l satisfies bathing standard.`,
      isViolation: false,
    };
  }

  if (parameter === 'pH') {
    const min = rule.minValue ?? 6.5;
    const max = rule.maxValue ?? 8.5;
    if (numericValue < min) {
      return {
        status: 'exceed',
        thresholdLabel: `< 6.5 (Acidic: ${(min - numericValue).toFixed(2)} below)`,
        message: `Acidic excursion: pH ${numericValue} is below acceptable 6.5 minimum.`,
        isViolation: true,
      };
    }
    if (numericValue > max) {
      return {
        status: 'exceed',
        thresholdLabel: `> 8.5 (Alkaline: ${(numericValue - max).toFixed(2)} above)`,
        message: `Alkaline excursion: pH ${numericValue} exceeds acceptable 8.5 maximum.`,
        isViolation: true,
      };
    }
    return {
      status: 'pass',
      thresholdLabel: '6.5 - 8.5',
      message: `Within threshold: pH ${numericValue} is within normal range.`,
      isViolation: false,
    };
  }

  return {
    status: 'unassessed',
    thresholdLabel: 'Unassessed',
    message: 'No criteria matched.',
    isViolation: false,
  };
}

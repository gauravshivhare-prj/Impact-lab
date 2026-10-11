export type RiskLabel =
  | 'Within reference'
  | 'Needs attention'
  | 'High concern'
  | 'Limited data'
  | 'Insufficient data';

export interface ParameterAssessment {
  value: number | null;
  status: 'Within reference' | 'Outside reference' | 'Insufficient data' | 'Not assessed';
}

export interface SiteRisk {
  site: string;
  waterBody: string;
  siteMatchConfidence: string;
  risk: RiskLabel;
  violations: number;
  parameters: Record<string, ParameterAssessment>;
}

export class RiskApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string) {
    super(`Risk API request failed (${status} ${code})`);
    this.status = status;
    this.code = code;
  }
}

export interface RiskQuery {
  year: number;
  phase?: 'pre' | 'during' | 'after';
  festival?: string;
}

/** Fetches risk assessments computed by the Python engine in engine/src/risk_engine.py. */
export async function fetchSiteRisks({ year, phase = 'after', festival }: RiskQuery): Promise<SiteRisk[]> {
  const params = new URLSearchParams({ year: String(year), phase });
  if (festival) params.set('festival', festival);

  const response = await fetch(`/api/v1/risk?${params}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new RiskApiError(response.status, body?.error?.code ?? 'UNKNOWN');
  }
  const body = (await response.json()) as { data: SiteRisk[] };
  return body.data;
}

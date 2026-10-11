import type { RawCsvRecord } from '../types';

const API_BASE = '/api/v1';

interface ApiGhatSummary {
  ghatId: string;
  name: string;
  waterBody: string;
}

interface ApiObservation {
  year: number;
  festival: string;
  phase: string;
  parameter: string;
  rawValue: string | null;
  numericValue: number | null;
  qualifier: string | null;
  unit: string | null;
  sourcePage: string | null;
  parameterAsPrinted: string | null;
  siteAsPrinted: string | null;
  siteMatchConfidence: string | null;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} failed (${response.status})`);
  }
  return ((await response.json()) as { data: T }).data;
}

// The API keeps BDL/ND as qualifiers and uses "missing" for blank or unsampled readings.
function toFlag(qualifier: string | null): string {
  if (qualifier === 'missing') return 'not sampled';
  return qualifier ?? '';
}

/**
 * Rebuilds the raw CSV-shaped records from the Express API so the existing client
 * validation and analysis pipeline keeps working unchanged.
 */
export async function fetchRawRecordsFromApi(): Promise<RawCsvRecord[]> {
  const ghats = await getJson<ApiGhatSummary[]>('/ghats');

  const details = await Promise.all(
    ghats.map((ghat) =>
      getJson<{ historicalEvidence: { observations: ApiObservation[] } }>(`/ghats/${ghat.ghatId}`),
    ),
  );

  return ghats.flatMap((ghat, index) =>
    details[index].historicalEvidence.observations.map(
      (obs): RawCsvRecord => ({
        year: String(obs.year),
        festival: obs.festival,
        site: ghat.name,
        water_body: ghat.waterBody,
        phase: obs.phase,
        parameter: obs.parameter,
        value: obs.numericValue === null ? '' : String(obs.numericValue),
        unit_assumed: obs.unit ?? '',
        flag: toFlag(obs.qualifier),
        value_as_printed: obs.rawValue ?? '',
        parameter_as_printed: obs.parameterAsPrinted ?? obs.parameter,
        site_as_printed: obs.siteAsPrinted ?? ghat.name,
        site_match_confidence: obs.siteMatchConfidence ?? 'high',
        source_page: obs.sourcePage ?? '',
      }),
    ),
  );
}

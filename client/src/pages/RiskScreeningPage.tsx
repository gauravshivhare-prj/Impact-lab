import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { fetchSiteRisks, RiskApiError, type RiskLabel, type SiteRisk } from '../services/riskApi';

interface RiskScreeningPageProps {
  language?: 'en' | 'hi';
}

const YEARS = [2025, 2024, 2023];
const FESTIVALS = ['Ganesh', 'Durga'];
const PHASES = ['pre', 'during', 'after'] as const;
const PARAMETERS = ['pH', 'Dissolved oxygen', 'BOD'];

const RISK_VARIANT: Record<RiskLabel, 'success' | 'warning' | 'danger' | 'neutral'> = {
  'Within reference': 'success',
  'Needs attention': 'warning',
  'High concern': 'danger',
  'Limited data': 'neutral',
  'Insufficient data': 'neutral',
};

type LoadState =
  | { kind: 'ready'; rows: SiteRisk[] }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

export const RiskScreeningPage: React.FC<RiskScreeningPageProps> = () => {
  const [year, setYear] = useState(2025);
  const [festival, setFestival] = useState('Ganesh');
  const [phase, setPhase] = useState<(typeof PHASES)[number]>('after');
  // The result is stored with the query it answers; a stale key means a request is still in flight.
  const queryKey = `${year}|${festival}|${phase}`;
  const [result, setResult] = useState<{ key: string; state: LoadState } | null>(null);
  const state: LoadState | null = result?.key === queryKey ? result.state : null;

  useEffect(() => {
    let cancelled = false;
    const finish = (next: LoadState) => !cancelled && setResult({ key: queryKey, state: next });
    fetchSiteRisks({ year, festival, phase })
      .then((rows) => finish({ kind: 'ready', rows }))
      .catch((err: unknown) => {
        if (err instanceof RiskApiError && err.code === 'INSUFFICIENT_DATA') {
          finish({ kind: 'empty' });
        } else if (err instanceof RiskApiError && err.code === 'ENGINE_UNAVAILABLE') {
          finish({ kind: 'error', message: 'The risk screening engine is not running. Start it with "npm run dev" from the project root.' });
        } else {
          finish({ kind: 'error', message: 'Risk screening could not be loaded.' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, year, festival, phase]);

  const selectClass = 'rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 text-teal-800 text-xs font-semibold uppercase tracking-wider">
          <ShieldAlert className="w-4 h-4" />
          <span>CPCB Class B reference screening</span>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            Year
            <select className={selectClass} value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Festival
            <select className={selectClass} value={festival} onChange={(e) => setFestival(e.target.value)}>
              {FESTIVALS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Phase
            <select className={selectClass} value={phase} onChange={(e) => setPhase(e.target.value as typeof phase)}>
              {PHASES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>
      </div>

      {state === null && <p className="text-sm text-slate-500">Running risk screening…</p>}
      {state?.kind === 'error' && (
        <div className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{state.message}</div>
      )}
      {state?.kind === 'empty' && (
        <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          No observations exist for {festival} {year} ({phase}). Missing data is never treated as clean.
        </div>
      )}

      {state?.kind === 'ready' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Ghat</th>
                <th className="px-4 py-3">Screening</th>
                <th className="px-4 py-3">Outside reference</th>
                {PARAMETERS.map((p) => <th key={p} className="px-4 py-3">{p}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.rows.map((row) => (
                <tr key={row.site}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{row.site}</div>
                    <div className="text-xs text-slate-500">{row.waterBody}</div>
                  </td>
                  <td className="px-4 py-3"><Badge variant={RISK_VARIANT[row.risk]}>{row.risk}</Badge></td>
                  <td className="px-4 py-3">{row.violations} of {PARAMETERS.length}</td>
                  {PARAMETERS.map((p) => {
                    const result = row.parameters[p];
                    return (
                      <td key={p} className="px-4 py-3">
                        <div className="text-slate-900">{result?.value ?? 'No reading'}</div>
                        <div className={result?.status === 'Outside reference' ? 'text-xs text-rose-700' : 'text-xs text-slate-500'}>
                          {result?.status ?? 'Not assessed'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Preliminary screening labels from historical MPPCB readings against CPCB Class B reference criteria
        (pH 6.5–8.5, dissolved oxygen ≥ 5 mg/L, BOD ≤ 3 mg/L). They do not certify current conditions, decide legal
        status, or declare any ghat safe. BDL and missing readings are never treated as zero.
      </p>
    </div>
  );
};

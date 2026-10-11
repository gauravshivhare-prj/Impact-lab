import { ApiError } from '../middleware/errorHandler.js';
import { validationError } from '../validators/common.validator.js';

const PHASES = ['pre', 'during', 'after'];
const ENGINE_TIMEOUT_MS = 5000;

function parseRiskQuery(query) {
  if (typeof query.year !== 'string' || !/^\d{4}$/.test(query.year)) {
    throw validationError('year must be a four-digit year.');
  }
  const phase = query.phase ?? 'after';
  if (!PHASES.includes(phase)) {
    throw validationError(`phase must be one of: ${PHASES.join(', ')}.`);
  }
  const params = new URLSearchParams({ year: query.year, phase });
  if (query.festival !== undefined) {
    if (typeof query.festival !== 'string' || !/^[A-Za-z ]{1,30}$/.test(query.festival)) {
      throw validationError('festival must be letters only (for example Ganesh or Durga).');
    }
    params.set('festival', query.festival);
  }
  return params;
}

/**
 * GET /risk — CPCB Class B screening computed by the Python risk engine (engine/).
 * Express stays the single public API; the engine is an internal service.
 */
export function createRiskHandler({ engineUrl, fetchImpl = (...args) => globalThis.fetch(...args) }) {
  return async function getRisk(req, res) {
    const params = parseRiskQuery(req.query);

    let upstream;
    try {
      upstream = await fetchImpl(`${engineUrl}/api/v1/risk?${params}`, {
        signal: AbortSignal.timeout(ENGINE_TIMEOUT_MS),
      });
    } catch {
      throw new ApiError(503, 'ENGINE_UNAVAILABLE', 'The risk screening engine is not reachable.');
    }

    if (upstream.status === 422) {
      throw new ApiError(422, 'INSUFFICIENT_DATA', 'No observations exist for these filters.');
    }
    if (!upstream.ok) {
      throw new ApiError(502, 'ENGINE_ERROR', 'The risk screening engine returned an error.');
    }

    res.json(await upstream.json());
  };
}

/**
 * Water Quality Simulation controller - deterministic benchmark comparisons.
 */

import { ApiError } from '../middleware/errorHandler.js';
import { simulateWaterQuality } from '../services/simulations/simulation.service.js';

export async function simulate(req, res) {
  const { dataContext } = req.app.locals;
  const request = req.validated;

  if (!dataContext.ghats.has(request.ghatId)) {
    throw new ApiError(404, 'GHAT_NOT_FOUND', 'No ghat exists with this ghatId.');
  }

  const result = simulateWaterQuality(request, { dataContext });

  res.json({
    data: result,
    meta: {
      isHypothetical: true,
      dataSource: 'MPPCB Reports 2023-2025',
    },
  });
}

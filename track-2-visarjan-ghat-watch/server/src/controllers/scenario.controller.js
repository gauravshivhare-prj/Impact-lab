import { ApiError } from '../middleware/errorHandler.js';
import { compareScenario } from '../services/scenarios/scenario.service.js';

export async function compare(req, res) {
  const { dataContext } = req.app.locals;
  const request = req.validated;

  if (!dataContext.ghats.has(request.ghatId)) {
    throw new ApiError(404, 'GHAT_NOT_FOUND', 'No ghat exists with this ghatId.');
  }

  const result = await compareScenario(request, { dataContext });
  res.json({ data: { ...result, isHypothetical: true }, meta: {} });
}

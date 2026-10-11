import { generateBrief } from '../services/reports/brief.service.js';

export function createBrief(req, res) {
  const { dataContext } = req.app.locals;
  res.json(generateBrief({ dataContext, ...req.validated }));
}

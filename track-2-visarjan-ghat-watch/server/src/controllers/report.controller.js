import { generateBrief } from '../services/reports/brief.service.js';

export async function createBrief(req, res) {
  const { dataContext, aiClient } = req.app.locals;
  const result = await generateBrief({ dataContext, aiClient, ...req.validated });
  res.json(result);
}

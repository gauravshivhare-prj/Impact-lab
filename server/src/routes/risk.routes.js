import { Router } from 'express';
import { createRiskHandler } from '../controllers/risk.controller.js';

export function createRiskRoutes({ engineUrl, fetchImpl }) {
  const router = Router();
  router.get('/', createRiskHandler({ engineUrl, fetchImpl }));
  return router;
}

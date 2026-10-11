import { Router } from 'express';
import { createBrief } from '../controllers/report.controller.js';
import { createBriefRateLimiter } from '../middleware/rateLimit.js';
import { validateBriefRequest } from '../validators/report.validator.js';

export function createReportRoutes() {
  const router = Router();
  router.post('/brief', createBriefRateLimiter(), validateBriefRequest, createBrief);
  return router;
}

import { Router } from 'express';
import { getRankings, getSummary } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/summary', getSummary);
router.get('/rankings', getRankings);

export default router;

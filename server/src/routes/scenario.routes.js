import { Router } from 'express';
import { compare } from '../controllers/scenario.controller.js';
import { validateScenarioRequest } from '../validators/scenario.validator.js';

const router = Router();

router.post('/compare', validateScenarioRequest, compare);

export default router;

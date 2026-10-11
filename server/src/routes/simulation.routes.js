import { Router } from 'express';
import { simulate } from '../controllers/simulation.controller.js';
import { validateSimulationRequest } from '../validators/simulation.validator.js';

const router = Router();

router.post('/water-quality', validateSimulationRequest, simulate);

export default router;

import { Router } from 'express';
import { getGhat, getGhatSources, listGhats } from '../controllers/ghat.controller.js';
import { validateGhatIdParam } from '../validators/common.validator.js';

const router = Router();

router.get('/', listGhats);
router.get('/:ghatId', validateGhatIdParam, getGhat);
router.get('/:ghatId/sources', validateGhatIdParam, getGhatSources);

export default router;

import { Router } from 'express';
import { chat } from '../controllers/assistant.controller.js';
import { validateChatRequest } from '../validators/assistant.validator.js';

const router = Router();

router.post('/chat', validateChatRequest, chat);

export default router;

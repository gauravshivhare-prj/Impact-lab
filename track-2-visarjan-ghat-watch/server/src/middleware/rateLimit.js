import { rateLimit } from 'express-rate-limit';
import { sendError } from './errorHandler.js';

function limitHandler(req, res) {
  sendError(res, 429, 'RATE_LIMITED', 'Too many requests. Please wait and try again.');
}

/** General API limit per client IP. */
export function createApiRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: limitHandler,
  });
}

/** Stricter limit for brief generation. */
export function createBriefRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: limitHandler,
  });
}

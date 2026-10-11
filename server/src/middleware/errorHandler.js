/**
 * Consistent JSON error envelope (docs/API_CONTRACT.md "Standard response shapes").
 * Only `code` and `message` ever reach the client — never stack traces, upstream
 * provider responses, or secrets.
 */

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function sendError(res, status, code, message) {
  res.status(status).json({ error: { code, message } });
}

export function notFoundHandler(req, res) {
  sendError(res, 404, 'NOT_FOUND', 'The requested resource was not found.');
}

// Express identifies error middleware by its four-argument signature.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof ApiError) {
    return sendError(res, err.status, err.code, err.message);
  }

  // Errors raised by express.json() body parsing.
  if (err?.type === 'entity.parse.failed') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'The request body is not valid JSON.');
  }
  if (err?.type === 'entity.too.large') {
    return sendError(res, 413, 'VALIDATION_ERROR', 'The request body is too large.');
  }
  // Other client errors raised by Express/body-parser (bad URL encoding of a path
  // parameter is a URIError with status 400; unsupported charset/encoding; aborted
  // request). Their messages are not forwarded.
  const isClientError = err?.status >= 400 && err.status < 500;
  if (isClientError && (err.expose || err instanceof URIError)) {
    return sendError(res, err.status, 'VALIDATION_ERROR', 'The request could not be validated.');
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('[error]', err?.name, err?.message);
  }
  return sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred.');
}

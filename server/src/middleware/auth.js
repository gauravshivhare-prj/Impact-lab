/**
 * Authentication middleware for GhatRakshak.
 *
 * Uses cookie-based sessions with server-side storage.
 * Sessions are stored in SQLite and validated on each request.
 */

import { findSession, cleanExpiredSessions } from '../db/database.js';

const SESSION_COOKIE_NAME = 'ghatrakshak_session';

// Clean expired sessions periodically (every 15 minutes)
setInterval(() => {
  try {
    cleanExpiredSessions();
  } catch (err) {
    console.error('Failed to clean expired sessions:', err);
  }
}, 15 * 60 * 1000);

/**
 * Middleware that attaches user info to req.user if a valid session exists.
 * Does not block the request - use requireAuth for protected routes.
 */
export function sessionMiddleware(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (sessionId) {
    try {
      const session = findSession(sessionId);
      if (session) {
        req.user = {
          id: session.user_id,
          username: session.username,
          role: session.role,
          displayName: session.display_name,
        };
        req.sessionId = sessionId;
      }
    } catch (err) {
      console.error('Session lookup error:', err);
    }
  }

  next();
}

/**
 * Middleware that requires authentication.
 * Returns 401 if no valid session.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
  }
  next();
}

/**
 * Middleware factory that requires a specific role.
 * Returns 403 if authenticated but wrong role.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
        },
      });
    }

    next();
  };
}

export { SESSION_COOKIE_NAME };

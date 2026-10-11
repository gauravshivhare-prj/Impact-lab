/**
 * Authentication routes for GhatRakshak.
 *
 * POST /auth/login   - Authenticate user
 * POST /auth/logout  - Invalidate session
 * GET  /auth/me      - Get current user info
 */

import { Router } from 'express';
import {
  findUserByUsername,
  verifyPassword,
  updateLastLogin,
  createSession,
  deleteSession,
  logAuditEntry,
} from '../db/database.js';
import { requireAuth, SESSION_COOKIE_NAME } from '../middleware/auth.js';

const router = Router();

// Cookie options for session
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  path: '/',
};

/**
 * POST /auth/login
 * Body: { username, password }
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username and password are required.',
      },
    });
  }

  try {
    const user = findUserByUsername(username);

    if (!user || !verifyPassword(user, password)) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password.',
        },
      });
    }

    // Create session
    const session = createSession(user.id);
    updateLastLogin(user.id);

    // Log the login
    logAuditEntry(
      user.id,
      user.username,
      'login',
      'session',
      session.id,
      { success: true },
      req.ip
    );

    // Set session cookie
    res.cookie(SESSION_COOKIE_NAME, session.id, cookieOptions);

    res.json({
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          displayName: user.display_name,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during login.',
      },
    });
  }
});

/**
 * POST /auth/logout
 */
router.post('/logout', requireAuth, (req, res) => {
  try {
    if (req.sessionId) {
      deleteSession(req.sessionId);

      logAuditEntry(
        req.user.id,
        req.user.username,
        'logout',
        'session',
        req.sessionId,
        {},
        req.ip
      );
    }

    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred during logout.',
      },
    });
  }
});

/**
 * GET /auth/me
 * Returns current authenticated user or 401
 */
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated.',
      },
    });
  }

  res.json({
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        displayName: req.user.displayName,
      },
    },
  });
});

export default router;

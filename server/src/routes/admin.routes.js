/**
 * Admin routes for GhatRakshak.
 *
 * All routes require administrator role.
 *
 * User Management:
 * - GET    /admin/users          - List all users
 * - POST   /admin/users          - Create new user
 * - DELETE /admin/users/:id      - Delete user
 *
 * Ghat Metadata:
 * - GET    /admin/ghats          - List ghat metadata
 * - GET    /admin/ghats/:ghatId  - Get ghat metadata
 * - PATCH  /admin/ghats/:ghatId  - Update ghat metadata
 *
 * Audit:
 * - GET    /admin/audit          - Get audit log
 */

import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import {
  listUsers,
  createUser,
  deleteUser,
  findUserById,
  getGhatMetadata,
  getAllGhatMetadata,
  upsertGhatMetadata,
  getAuditLog,
  logAuditEntry,
  adminCount,
} from '../db/database.js';

const router = Router();

// All admin routes require administrator role
router.use(requireRole('administrator'));

// ==================== USER MANAGEMENT ====================

/**
 * GET /admin/users
 */
router.get('/users', (req, res) => {
  try {
    const users = listUsers();
    res.json({
      data: users,
      meta: { count: users.length },
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to list users.' },
    });
  }
});

/**
 * POST /admin/users
 * Body: { username, password, role, displayName? }
 */
router.post('/users', (req, res) => {
  const { username, password, role, displayName } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Username, password, and role are required.',
      },
    });
  }

  if (!['municipal_officer', 'administrator'].includes(role)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Role must be municipal_officer or administrator.',
      },
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters.',
      },
    });
  }

  try {
    const user = createUser(username, password, role, displayName);

    logAuditEntry(
      req.user.id,
      req.user.username,
      'create',
      'user',
      user.id,
      { username: user.username, role: user.role },
      req.ip
    );

    res.status(201).json({ data: user });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Username already exists.' },
      });
    }
    console.error('Create user error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to create user.' },
    });
  }
});

/**
 * DELETE /admin/users/:id
 */
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    return res.status(400).json({
      error: { code: 'INVALID_OPERATION', message: 'Cannot delete your own account.' },
    });
  }

  try {
    const user = findUserById(id);
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found.' },
      });
    }

    // Prevent deleting the last administrator
    if (user.role === 'administrator' && adminCount() <= 1) {
      return res.status(400).json({
        error: { code: 'INVALID_OPERATION', message: 'Cannot delete the last administrator.' },
      });
    }

    deleteUser(id);

    logAuditEntry(
      req.user.id,
      req.user.username,
      'delete',
      'user',
      id,
      { deletedUsername: user.username },
      req.ip
    );

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to delete user.' },
    });
  }
});

// ==================== GHAT METADATA ====================

/**
 * GET /admin/ghats
 */
router.get('/ghats', (req, res) => {
  try {
    const metadata = getAllGhatMetadata();
    res.json({
      data: metadata,
      meta: { count: metadata.length },
    });
  } catch (err) {
    console.error('List ghat metadata error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to list ghat metadata.' },
    });
  }
});

/**
 * GET /admin/ghats/:ghatId
 */
router.get('/ghats/:ghatId', (req, res) => {
  try {
    const metadata = getGhatMetadata(req.params.ghatId);
    if (!metadata) {
      return res.json({ data: null });
    }
    res.json({ data: metadata });
  } catch (err) {
    console.error('Get ghat metadata error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get ghat metadata.' },
    });
  }
});

/**
 * PATCH /admin/ghats/:ghatId
 * Body: { description?, operationalStatus?, operationalNotes? }
 */
router.patch('/ghats/:ghatId', (req, res) => {
  const { ghatId } = req.params;
  const { description, operationalStatus, operationalNotes } = req.body;

  if (operationalStatus && !['active', 'restricted', 'closed', 'under_review'].includes(operationalStatus)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'operationalStatus must be active, restricted, closed, or under_review.',
      },
    });
  }

  try {
    const oldMetadata = getGhatMetadata(ghatId);

    const metadata = upsertGhatMetadata(
      ghatId,
      description ?? oldMetadata?.description ?? null,
      operationalStatus ?? oldMetadata?.operational_status ?? 'active',
      operationalNotes ?? oldMetadata?.operational_notes ?? null,
      req.user.id
    );

    logAuditEntry(
      req.user.id,
      req.user.username,
      'update',
      'ghat_metadata',
      ghatId,
      { description, operationalStatus, operationalNotes },
      req.ip
    );

    res.json({ data: metadata });
  } catch (err) {
    console.error('Update ghat metadata error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update ghat metadata.' },
    });
  }
});

// ==================== AUDIT LOG ====================

/**
 * GET /admin/audit
 * Query: { limit?, offset? }
 */
router.get('/audit', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const logs = getAuditLog(limit, offset);
    res.json({
      data: logs,
      meta: { limit, offset, count: logs.length },
    });
  } catch (err) {
    console.error('Get audit log error:', err);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get audit log.' },
    });
  }
});

export default router;

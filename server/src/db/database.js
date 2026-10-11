/**
 * SQLite database initialization for GhatRakshak authentication.
 *
 * Tables:
 * - users: Authentication and role management
 * - audit_log: Track administrative actions
 * - ghat_metadata: Editable descriptive metadata (separate from historical observations)
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, '../../data/ghatrakshak.db');

let db = null;

export function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeTables();
  }
  return db;
}

function initializeTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('municipal_officer', 'administrator')),
      display_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      changes TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ghat_metadata (
      ghat_id TEXT PRIMARY KEY,
      description TEXT,
      operational_status TEXT DEFAULT 'active',
      operational_notes TEXT,
      last_updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (last_updated_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
  `);
}

export function createUser(username, password, role, displayName = null) {
  const db = getDatabase();
  const id = randomUUID();
  const passwordHash = bcrypt.hashSync(password, 12);

  const stmt = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, display_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, username.toLowerCase(), passwordHash, role, displayName || username);
  return { id, username: username.toLowerCase(), role, displayName: displayName || username };
}

export function findUserByUsername(username) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
}

export function findUserById(id) {
  const db = getDatabase();
  return db.prepare('SELECT id, username, role, display_name, created_at, last_login FROM users WHERE id = ?').get(id);
}

export function verifyPassword(user, password) {
  return bcrypt.compareSync(password, user.password_hash);
}

export function updateLastLogin(userId) {
  const db = getDatabase();
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(userId);
}

export function listUsers() {
  const db = getDatabase();
  return db.prepare('SELECT id, username, role, display_name, created_at, last_login FROM users ORDER BY created_at DESC').all();
}

export function deleteUser(userId) {
  const db = getDatabase();
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function createSession(userId) {
  const db = getDatabase();
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expiresAt);
  return { id, userId, expiresAt };
}

export function findSession(sessionId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT s.*, u.username, u.role, u.display_name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId);
}

export function deleteSession(sessionId) {
  const db = getDatabase();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function cleanExpiredSessions() {
  const db = getDatabase();
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
}

export function logAuditEntry(userId, username, action, entityType, entityId, changes, ipAddress) {
  const db = getDatabase();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO audit_log (id, user_id, username, action, entity_type, entity_id, changes, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, username, action, entityType, entityId, JSON.stringify(changes), ipAddress);

  return id;
}

export function getAuditLog(limit = 100, offset = 0) {
  const db = getDatabase();
  return db.prepare(`
    SELECT * FROM audit_log
    ORDER BY timestamp DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
}

export function getGhatMetadata(ghatId) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM ghat_metadata WHERE ghat_id = ?').get(ghatId);
}

export function upsertGhatMetadata(ghatId, description, operationalStatus, operationalNotes, userId) {
  const db = getDatabase();

  const existing = getGhatMetadata(ghatId);

  if (existing) {
    db.prepare(`
      UPDATE ghat_metadata
      SET description = ?, operational_status = ?, operational_notes = ?,
          last_updated_by = ?, updated_at = datetime('now')
      WHERE ghat_id = ?
    `).run(description, operationalStatus, operationalNotes, userId, ghatId);
  } else {
    db.prepare(`
      INSERT INTO ghat_metadata (ghat_id, description, operational_status, operational_notes, last_updated_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(ghatId, description, operationalStatus, operationalNotes, userId);
  }

  return getGhatMetadata(ghatId);
}

export function getAllGhatMetadata() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM ghat_metadata').all();
}

export function userCount() {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get();
  return result.count;
}

export function adminCount() {
  const db = getDatabase();
  const result = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'administrator'").get();
  return result.count;
}

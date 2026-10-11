#!/usr/bin/env node
/**
 * First Administrator Provisioning for GhatRakshak.
 *
 * This script creates the initial administrator account.
 *
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=yourpassword node src/db/provision-admin.js
 *
 * Or for development:
 *   node src/db/provision-admin.js --dev
 *
 * The --dev flag creates a development admin with username 'admin' and
 * password from ADMIN_INITIAL_PASSWORD env var (or prompts if not set).
 *
 * SECURITY:
 * - Never use --dev in production
 * - Change the admin password immediately after first login
 * - Do not commit credentials
 */

import { createUser, userCount, adminCount, getDatabase } from './database.js';
import * as readline from 'readline';

const isDev = process.argv.includes('--dev');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n🔐 GhatRakshak Administrator Provisioning\n');

  // Initialize database
  getDatabase();

  const existingAdmins = adminCount();
  const existingUsers = userCount();

  console.log(`Current state: ${existingUsers} users, ${existingAdmins} administrators\n`);

  if (existingAdmins > 0 && !process.env.FORCE_PROVISION) {
    console.log('✓ An administrator already exists.');
    console.log('  Set FORCE_PROVISION=1 to create additional administrators.\n');
    process.exit(0);
  }

  let username, password, displayName;

  if (isDev) {
    console.log('⚠️  Development mode - creating default admin account\n');
    username = process.env.ADMIN_USERNAME || 'admin';
    password = process.env.ADMIN_INITIAL_PASSWORD;

    if (!password) {
      console.log('Set ADMIN_INITIAL_PASSWORD environment variable or enter password:');
      password = await prompt('Password (min 8 chars): ');
    }

    displayName = 'Development Admin';
  } else {
    username = process.env.ADMIN_USERNAME;
    password = process.env.ADMIN_PASSWORD;

    if (!username) {
      username = await prompt('Admin username: ');
    }

    if (!password) {
      password = await prompt('Admin password (min 8 chars): ');
    }

    // Non-interactive hosts (Docker/Render) have no TTY, so never wait on a prompt there.
    displayName =
      process.env.ADMIN_DISPLAY_NAME ||
      (process.stdin.isTTY ? await prompt('Display name (optional): ') : '') ||
      username;
  }

  if (!username || username.length < 3) {
    console.error('✗ Username must be at least 3 characters.\n');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('✗ Password must be at least 8 characters.\n');
    process.exit(1);
  }

  try {
    const user = createUser(username, password, 'administrator', displayName);

    console.log('\n✓ Administrator created successfully!\n');
    console.log(`  Username: ${user.username}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Display Name: ${user.displayName}\n`);

    if (isDev) {
      console.log('⚠️  This is a development account. Do not use in production.\n');
    } else {
      console.log('📌 Please change the password after first login.\n');
    }

    process.exit(0);
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed')) {
      console.error(`✗ Username '${username}' already exists.\n`);
    } else {
      console.error('✗ Failed to create administrator:', err.message, '\n');
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { findUserByUsername, createUser } = require('../db/userModel');

const TEST_USERNAME = process.env.TDPS_TEST_USER || 'bruteforcetest';
const TEST_PASSWORD = process.env.TDPS_TEST_PASS || 'CorrectPass123';

async function setup() {
  // Clear prior logs/alerts/blocks so each test run starts clean
  db.exec('DELETE FROM login_logs;');
  db.exec('DELETE FROM security_alerts;');
  db.exec('DELETE FROM blocked_entities;');

  const existing = findUserByUsername(TEST_USERNAME);
  if (!existing) {
    const hash = await bcrypt.hash(TEST_PASSWORD, 10);
    createUser(TEST_USERNAME, hash, 'student', 'TEST-0001');
    console.log(`Created test account: ${TEST_USERNAME}`);
  } else {
    console.log(`Test account already exists: ${TEST_USERNAME}`);
  }
  console.log('Database cleared: login_logs, security_alerts, blocked_entities.');
}

setup();

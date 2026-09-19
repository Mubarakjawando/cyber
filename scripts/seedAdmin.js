const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { findUserByUsername, createUser } = require('../db/userModel');

async function seedAdmin() {
  if (!config.adminUsername || !config.adminPassword) {
    console.error('ADMIN_USERNAME and ADMIN_PASSWORD must be set before seeding.');
    return;
  }

  const existing = findUserByUsername(config.adminUsername);
  if (existing) {
    console.log(`Admin account '${config.adminUsername}' already exists. No changes made.`);
    return;
  }

  const hash = await bcrypt.hash(config.adminPassword, 10);
  createUser(config.adminUsername, hash, 'admin', null);
  console.log(`Admin account created: ${config.adminUsername}`);
}

// Allow running directly via `node scripts/seedAdmin.js` / `npm run seed:admin`
if (require.main === module) {
  seedAdmin();
}

module.exports = seedAdmin;

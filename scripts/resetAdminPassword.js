const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { findUserByUsername, updateUserPassword } = require('../db/userModel');

async function resetAdminPassword() {
  const user = findUserByUsername(config.adminUsername);
  if (!user) {
    console.error(`No user found with username '${config.adminUsername}'.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(config.adminPassword, 10);
  updateUserPassword(user.user_id, hash);
  console.log(`Password for '${config.adminUsername}' reset to match .env. Role is currently: ${user.role}`);
}

resetAdminPassword();

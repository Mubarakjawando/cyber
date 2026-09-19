const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { getRecentLogins } = require('../db/logModel');
const { getRecentAlerts } = require('../db/alertModel');
const { getAllBlocked, unblockIp } = require('../db/blockModel');
const { findUserByUsername, createUser } = require('../db/userModel');
const { generateToken } = require('../middleware/csrf');

router.get('/admin', requireAdmin, (req, res) => {
  const logins = getRecentLogins(25);
  const alerts = getRecentAlerts(25);
  const blocked = getAllBlocked();

  res.render('admin', {
    username: req.session.username,
    logins,
    alerts,
    blocked,
    csrfToken: generateToken(req)
  });
});

router.post('/admin/unblock', requireAdmin, (req, res) => {
  const { ip_address } = req.body;
  if (ip_address) {
    unblockIp(ip_address);
  }
  res.redirect('/admin');
});

// --- Staff account creation (admin only) ---
router.get('/admin/create-staff', requireAdmin, (req, res) => {
  res.render('admin-create-staff', {
    username: req.session.username,
    error: null,
    created: null,
    csrfToken: generateToken(req)
  });
});

router.post('/admin/create-staff', requireAdmin, async (req, res) => {
  const { staff_username, staff_password, staff_no } = req.body;

  const renderWith = (error, created) => res.render('admin-create-staff', {
    username: req.session.username,
    error,
    created,
    csrfToken: generateToken(req)
  });

  if (!staff_username || !staff_password) {
    return renderWith('Username and a temporary password are required.', null);
  }

  if (staff_password.length < 8) {
    return renderWith('Temporary password must be at least 8 characters.', null);
  }

  const existing = findUserByUsername(staff_username);
  if (existing) {
    return renderWith('That username is already taken.', null);
  }

  const passwordHash = await bcrypt.hash(staff_password, 10);
  createUser(staff_username, passwordHash, 'staff', staff_no || null);

  return renderWith(null, { username: staff_username, password: staff_password });
});

module.exports = router;

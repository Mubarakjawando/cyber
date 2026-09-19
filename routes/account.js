const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { findUserByUsername, updateUserPassword } = require('../db/userModel');
const { generateToken } = require('../middleware/csrf');

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

router.get('/account/change-password', requireLogin, (req, res) => {
  res.render('change-password', {
    username: req.session.username,
    role: req.session.role,
    error: null,
    success: null,
    csrfToken: generateToken(req)
  });
});

router.post('/account/change-password', requireLogin, async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const user = findUserByUsername(req.session.username);

  const renderWith = (error, success) => res.render('change-password', {
    username: req.session.username,
    role: req.session.role,
    error,
    success,
    csrfToken: generateToken(req)
  });

  if (!current_password || !new_password || !confirm_password) {
    return renderWith('All fields are required.', null);
  }

  const match = await bcrypt.compare(current_password, user.password_hash);
  if (!match) {
    return renderWith('Current password is incorrect.', null);
  }

  if (new_password !== confirm_password) {
    return renderWith('New password and confirmation do not match.', null);
  }

  if (new_password.length < 8) {
    return renderWith('New password must be at least 8 characters.', null);
  }

  const newHash = await bcrypt.hash(new_password, 10);
  updateUserPassword(user.user_id, newHash);

  return renderWith(null, 'Password updated successfully.');
});

module.exports = router;

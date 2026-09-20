const express = require('express');
const router = express.Router();
const { createMessage, getMessagesByUsername } = require('../db/supportModel');
const { generateToken } = require('../middleware/csrf');

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

router.get('/support', requireLogin, (req, res) => {
  const messages = getMessagesByUsername(req.session.username);
  res.render('support', {
    username: req.session.username,
    role: req.session.role,
    messages,
    error: null,
    success: null,
    csrfToken: generateToken(req)
  });
});

router.post('/support', requireLogin, (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    const messages = getMessagesByUsername(req.session.username);
    return res.render('support', {
      username: req.session.username,
      role: req.session.role,
      messages,
      error: 'Subject and message are both required.',
      success: null,
      csrfToken: generateToken(req)
    });
  }

  createMessage({
    userId: req.session.userId,
    username: req.session.username,
    subject: subject.trim(),
    message: message.trim()
  });

  const messages = getMessagesByUsername(req.session.username);
  res.render('support', {
    username: req.session.username,
    role: req.session.role,
    messages,
    error: null,
    success: 'Your message has been sent to the administrator.',
    csrfToken: generateToken(req)
  });
});

module.exports = router;

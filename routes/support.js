const express = require('express');
const router = express.Router();
const {
  createThread,
  addMessage,
  findActiveThreadByUsername,
  getThreadMessages
} = require('../db/supportModel');
const { generateToken } = require('../middleware/csrf');

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}

router.get('/support', requireLogin, (req, res) => {
  const thread = findActiveThreadByUsername(req.session.username);

  if (thread) {
    const messages = getThreadMessages(thread.thread_id);
    return res.render('support', {
      mode: 'chat',
      thread,
      messages,
      error: null,
      csrfToken: generateToken(req)
    });
  }

  res.render('support', { mode: 'form', error: null, csrfToken: generateToken(req) });
});

router.post('/support', requireLogin, (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.render('support', {
      mode: 'form',
      error: 'Subject and message are both required.',
      csrfToken: generateToken(req)
    });
  }

  createThread({
    userId: req.session.userId,
    username: req.session.username,
    isGuest: 0,
    subject: subject.trim(),
    initialMessage: message.trim()
  });

  res.redirect('/support');
});

router.post('/support/reply', requireLogin, (req, res) => {
  const { body } = req.body;
  const thread = findActiveThreadByUsername(req.session.username);

  if (thread && body && body.trim()) {
    addMessage(thread.thread_id, 'user', body.trim());
  }

  res.redirect('/support');
});

module.exports = router;

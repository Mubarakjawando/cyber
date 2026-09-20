const express = require('express');
const router = express.Router();
const {
  generateGuestToken,
  createThread,
  addMessage,
  findActiveThreadByGuest,
  getThreadMessages
} = require('../db/supportModel');
const { generateToken } = require('../middleware/csrf');
const getClientIp = require('../middleware/getClientIp');

const GUEST_COOKIE = 'tdps_guest_thread';

router.get('/contact', (req, res) => {
  const token = req.cookies[GUEST_COOKIE];
  const ipAddress = getClientIp(req);

  if (token) {
    const thread = findActiveThreadByGuest(token, ipAddress);
    if (thread) {
      const messages = getThreadMessages(thread.thread_id);
      return res.render('contact', {
        mode: 'chat',
        thread,
        messages,
        error: null,
        csrfToken: generateToken(req)
      });
    }
  }

  res.render('contact', { mode: 'form', error: null, csrfToken: generateToken(req) });
});

router.post('/contact', (req, res) => {
  const { full_name, matric_or_staff_no, subject, message } = req.body;
  const ipAddress = getClientIp(req);

  if (!full_name || !matric_or_staff_no || !subject || !message) {
    return res.render('contact', {
      mode: 'form',
      error: 'All fields are required so an administrator can verify your identity.',
      csrfToken: generateToken(req)
    });
  }

  const guestToken = generateGuestToken();
  const threadId = createThread({
    username: full_name.trim(),
    matricOrStaffNo: matric_or_staff_no.trim(),
    isGuest: 1,
    guestToken,
    ipAddress,
    subject: subject.trim(),
    initialMessage: message.trim()
  });

  res.cookie(GUEST_COOKIE, guestToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure,
    maxAge: 1000 * 60 * 60 * 24 * 3 // 3 days
  });

  res.redirect('/contact');
});

router.post('/contact/reply', (req, res) => {
  const token = req.cookies[GUEST_COOKIE];
  const ipAddress = getClientIp(req);
  const { body } = req.body;

  if (!token || !body || !body.trim()) {
    return res.redirect('/contact');
  }

  const thread = findActiveThreadByGuest(token, ipAddress);
  if (thread) {
    addMessage(thread.thread_id, 'user', body.trim());
  }

  res.redirect('/contact');
});

module.exports = router;

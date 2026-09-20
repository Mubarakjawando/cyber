const express = require('express');
const router = express.Router();
const { createMessage } = require('../db/supportModel');
const { generateToken } = require('../middleware/csrf');

router.get('/contact', (req, res) => {
  res.render('contact', {
    error: null,
    success: null,
    csrfToken: generateToken(req)
  });
});

router.post('/contact', (req, res) => {
  const { full_name, matric_or_staff_no, subject, message } = req.body;

  if (!full_name || !matric_or_staff_no || !subject || !message) {
    return res.render('contact', {
      error: 'All fields are required so an administrator can verify your identity.',
      success: null,
      csrfToken: generateToken(req)
    });
  }

  createMessage({
    userId: null,
    username: full_name.trim(),
    matricOrStaffNo: matric_or_staff_no.trim(),
    isGuest: 1,
    subject: subject.trim(),
    message: message.trim()
  });

  res.render('contact', {
    error: null,
    success: 'Your message has been sent. An administrator will verify your details and respond.',
    csrfToken: generateToken(req)
  });
});

module.exports = router;

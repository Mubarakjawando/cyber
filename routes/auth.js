const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { findUserByUsername, createUser } = require('../db/userModel');
const { recordLoginAttempt } = require('../db/logModel');
const { evaluateRisk } = require('../middleware/detectionEngine');
const { createAlert } = require('../db/alertModel');
const { verifyCaptcha } = require('../middleware/captcha');
const { blockIp } = require('../db/blockModel');
const { generateToken } = require('../middleware/csrf');
const { isValidMatric } = require('../config/matric');
const getClientIp = require('../middleware/getClientIp');
const config = require('../config/env');

// --- Registration (students only) ---
router.get('/register', (req, res) => {
  res.render('register', { error: null, csrfToken: generateToken(req) });
});

router.post('/register', async (req, res) => {
  const { username, password, matric_or_staff_no, surname, first_name, last_name } = req.body;

  if (!username || !password) {
    return res.render('register', { error: 'Username and password are required.', csrfToken: generateToken(req) });
  }

  if (!surname || !first_name || !last_name) {
    return res.render('register', { error: 'Surname, first name, and last name are all required.', csrfToken: generateToken(req) });
  }

  if (matric_or_staff_no && !isValidMatric(matric_or_staff_no)) {
    return res.render('register', { error: 'Matric number format is not recognized. Please check and try again.', csrfToken: generateToken(req) });
  }

  const existing = findUserByUsername(username);
  if (existing) {
    return res.render('register', { error: 'That username is already taken.', csrfToken: generateToken(req) });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  createUser(username, passwordHash, 'student', matric_or_staff_no || null, surname.trim(), first_name.trim(), last_name.trim());

  res.redirect('/login');
});

// --- Login ---
router.get('/login', (req, res) => {
  res.render('login', { error: null, showCaptcha: false, siteKey: config.recaptchaSiteKey, csrfToken: generateToken(req) });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const captchaToken = req.body['g-recaptcha-response'];
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  const risk = evaluateRisk({ ipAddress, username });

  if (risk.decision === 'prevent') {
    createAlert({ ipAddress, username, riskScore: risk.riskScore, alertType: 'brute_force_prevented' });
    blockIp({
      ipAddress,
      reason: `Exceeded high-risk threshold (${risk.riskScore} failed attempts) for account '${username}'`,
      expiresInMinutes: 60
    });

    const preBlockCsrfToken = generateToken(req);

    if (req.session) {
      req.session.destroy(() => {});
    }
    return res.status(403).render('login', {
      error: 'Too many failed attempts. Your IP address has been blocked for 60 minutes.',
      showCaptcha: false,
      siteKey: config.recaptchaSiteKey,
      csrfToken: preBlockCsrfToken
    });
  }

  const showCaptcha = risk.decision === 'detain';

  if (showCaptcha) {
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      createAlert({ ipAddress, username, riskScore: risk.riskScore, alertType: 'captcha_challenge' });
      recordLoginAttempt({ username, ipAddress, userAgent, status: 'failed' });
      return res.render('login', {
        error: 'Please complete the CAPTCHA challenge to continue.',
        showCaptcha: true,
        siteKey: config.recaptchaSiteKey,
        csrfToken: generateToken(req)
      });
    }
  }

  const user = findUserByUsername(username);

  if (!user) {
    recordLoginAttempt({ username, ipAddress, userAgent, status: 'failed' });
    return res.render('login', { error: 'Invalid username or password.', showCaptcha, siteKey: config.recaptchaSiteKey, csrfToken: generateToken(req) });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    recordLoginAttempt({ username, ipAddress, userAgent, status: 'failed' });
    return res.render('login', { error: 'Invalid username or password.', showCaptcha, siteKey: config.recaptchaSiteKey, csrfToken: generateToken(req) });
  }

  recordLoginAttempt({ username, ipAddress, userAgent, status: 'success' });

  req.session.userId = user.user_id;
  req.session.username = user.username;
  req.session.role = user.role;
  req.session.fullName = [user.first_name, user.last_name, user.surname].filter(Boolean).join(' ');

  if (user.role === 'student' && config.schoolPortalUrl) {
    return res.redirect(config.schoolPortalUrl);
  }

  res.redirect('/dashboard');
});

// --- Logout ---
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;

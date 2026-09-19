const config = require('../config/env');

async function verifyCaptcha(token) {
  if (!token) return false;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.recaptchaSecretKey,
        response: token
      })
    });

    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('reCAPTCHA verification error:', err.message);
    return false;
  }
}

module.exports = { verifyCaptcha };

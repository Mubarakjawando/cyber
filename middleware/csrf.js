const crypto = require('crypto');

function generateToken(req) {
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  return token;
}

function csrfProtection(req, res, next) {
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) {
    return next();
  }

  const submittedToken = req.body._csrf;
  const sessionToken = req.session.csrfToken;

  if (!sessionToken || !submittedToken || submittedToken !== sessionToken) {
    // Session likely expired or was reset (e.g. a free-tier host waking
    // from sleep). Send the user back to a fresh, working form instead
    // of showing a raw error page.
    const returnTo = req.originalUrl.startsWith('/register') ? '/register' : '/login';
    return res.redirect(`${returnTo}?session_expired=1`);
  }

  next();
}

module.exports = { generateToken, csrfProtection };

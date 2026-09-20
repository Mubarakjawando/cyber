const crypto = require('crypto');

// Reuses the session's existing token if one is already set, so opening
// or refreshing a page in one tab doesn't invalidate a form already
// loaded in another tab of the same browser (they share one session).
// A fresh token is only generated for a session that doesn't have one yet.
function generateToken(req) {
  if (req.session.csrfToken) {
    return req.session.csrfToken;
  }
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
    const returnTo = req.originalUrl.startsWith('/register') ? '/register' : '/login';
    return res.redirect(`${returnTo}?session_expired=1`);
  }

  next();
}

module.exports = { generateToken, csrfProtection };

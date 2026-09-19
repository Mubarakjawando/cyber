const crypto = require('crypto');

// Generates a token, stores it in the session, and returns it for embedding in a form.
function generateToken(req) {
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  return token;
}

// Middleware: verifies req.body._csrf matches the token stored in session.
// Applies only to state-changing methods; GET/HEAD/OPTIONS pass through untouched.
function csrfProtection(req, res, next) {
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) {
    return next();
  }

  const submittedToken = req.body._csrf;
  const sessionToken = req.session.csrfToken;

  if (!sessionToken || !submittedToken || submittedToken !== sessionToken) {
    return res.status(403).send('Invalid or missing CSRF token. Please refresh the page and try again.');
  }

  next();
}

module.exports = { generateToken, csrfProtection };

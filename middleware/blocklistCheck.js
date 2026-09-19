const { isIpBlocked } = require('../db/blockModel');
const getClientIp = require('./getClientIp');

function blocklistCheck(req, res, next) {
  const ipAddress = getClientIp(req);
  const blockRecord = isIpBlocked(ipAddress);

  if (blockRecord) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Access denied — TDPS</title>
        <link rel="stylesheet" href="/css/styles.css">
      </head>
      <body class="auth">
        <div class="auth-shell">
          <div class="wordmark">MAPOLY Portal Security</div>
          <div class="card">
            <h1>Access denied</h1>
            <p class="subtitle">Your IP address has been temporarily blocked due to suspicious activity.</p>
            <div class="banner banner-danger">${blockRecord.reason}</div>
            <p class="subtitle">Contact your system administrator if you believe this is an error.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  next();
}

module.exports = blocklistCheck;

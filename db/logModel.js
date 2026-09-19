const db = require('./connection');

function recordLoginAttempt({ username, ipAddress, userAgent, status }) {
  const stmt = db.prepare(`
    INSERT INTO login_logs (username, ip_address, user_agent, status)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(username || null, ipAddress, userAgent || null, status);
}

function getRecentFailures({ ipAddress, username, windowMinutes }) {
  const stmt = db.prepare(`
    SELECT COUNT(*) AS failCount
    FROM login_logs
    WHERE status = 'failed'
      AND timestamp >= datetime('now', '-' || ? || ' minutes')
      AND (ip_address = ? OR username = ?)
  `);
  const row = stmt.get(windowMinutes, ipAddress, username || '');
  return row.failCount;
}


function getRecentLogins(limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM login_logs ORDER BY timestamp DESC LIMIT ?
  `);
  return stmt.all(limit);
}

module.exports = { recordLoginAttempt, getRecentFailures, getRecentLogins };

const db = require('./connection');

function blockIp({ ipAddress, reason, expiresInMinutes = null }) {
  const expiresAt = expiresInMinutes
    ? new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()
    : null;
  const permanent = expiresInMinutes === null ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO blocked_entities (ip_address, reason, expires_at, permanent)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(ip_address) DO UPDATE SET
      reason = excluded.reason,
      blocked_at = datetime('now'),
      expires_at = excluded.expires_at,
      permanent = excluded.permanent
  `);
  return stmt.run(ipAddress, reason, expiresAt, permanent);
}

function isIpBlocked(ipAddress) {
  const stmt = db.prepare(`
    SELECT * FROM blocked_entities
    WHERE ip_address = ?
      AND (permanent = 1 OR expires_at > datetime('now'))
  `);
  return stmt.get(ipAddress) || null;
}

function unblockIp(ipAddress) {
  const stmt = db.prepare(`DELETE FROM blocked_entities WHERE ip_address = ?`);
  return stmt.run(ipAddress);
}

function getAllBlocked() {
  const stmt = db.prepare(`SELECT * FROM blocked_entities ORDER BY blocked_at DESC`);
  return stmt.all();
}

module.exports = { blockIp, isIpBlocked, unblockIp, getAllBlocked };

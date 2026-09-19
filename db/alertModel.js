const db = require('./connection');

function createAlert({ ipAddress, username, riskScore, alertType }) {
  const stmt = db.prepare(`
    INSERT INTO security_alerts (ip_address, username, risk_score, alert_type)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(ipAddress, username || null, riskScore, alertType);
}

function getRecentAlerts(limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM security_alerts ORDER BY created_at DESC LIMIT ?
  `);
  return stmt.all(limit);
}

module.exports = { createAlert, getRecentAlerts };

const db = require('./connection');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      matric_or_staff_no TEXT,
      surname TEXT,
      first_name TEXT,
      last_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS login_logs (
      log_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS security_alerts (
      alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT NOT NULL,
      username TEXT,
      risk_score INTEGER NOT NULL,
      alert_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS blocked_entities (
      block_id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT UNIQUE NOT NULL,
      reason TEXT NOT NULL,
      blocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT,
      permanent INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs (ip_address, timestamp);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs (username, timestamp);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_entities_ip ON blocked_entities (ip_address);`);

  console.log('✅ Database schema initialized successfully.');
}

module.exports = initSchema;

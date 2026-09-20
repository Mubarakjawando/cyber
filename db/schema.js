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

  db.exec(`
    CREATE TABLE IF NOT EXISTS support_threads (
      thread_id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      matric_or_staff_no TEXT,
      is_guest INTEGER NOT NULL DEFAULT 0,
      guest_token TEXT,
      ip_address TEXT,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS support_thread_messages (
      message_id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES support_threads(thread_id),
      sender TEXT NOT NULL CHECK (sender IN ('user','admin')),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_logs_ip ON login_logs (ip_address, timestamp);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_logs_username ON login_logs (username, timestamp);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_blocked_entities_ip ON blocked_entities (ip_address);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_threads_status ON support_threads (status, updated_at);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_thread_messages_thread ON support_thread_messages (thread_id, created_at);`);

  console.log('✅ Database schema initialized successfully.');
}

module.exports = initSchema;

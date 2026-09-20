const db = require('./connection');
const crypto = require('crypto');

function generateGuestToken() {
  return crypto.randomBytes(24).toString('hex');
}

function createThread({ userId = null, username, matricOrStaffNo = null, isGuest = 0, guestToken = null, ipAddress = null, subject, initialMessage }) {
  const insertThread = db.prepare(`
    INSERT INTO support_threads (user_id, username, matric_or_staff_no, is_guest, guest_token, ip_address, subject)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insertThread.run(userId, username, matricOrStaffNo, isGuest ? 1 : 0, guestToken, ipAddress, subject);
  const threadId = result.lastInsertRowid;

  addMessage(threadId, 'user', initialMessage);
  return threadId;
}

function addMessage(threadId, sender, body) {
  const insertMsg = db.prepare(`
    INSERT INTO support_thread_messages (thread_id, sender, body) VALUES (?, ?, ?)
  `);
  insertMsg.run(threadId, sender, body);

  db.prepare(`UPDATE support_threads SET updated_at = datetime('now') WHERE thread_id = ?`).run(threadId);
}

function findActiveThreadByGuest(guestToken, ipAddress) {
  const stmt = db.prepare(`
    SELECT * FROM support_threads
    WHERE guest_token = ? AND ip_address = ? AND status = 'open'
    ORDER BY updated_at DESC LIMIT 1
  `);
  return stmt.get(guestToken, ipAddress);
}

function findActiveThreadByUsername(username) {
  const stmt = db.prepare(`
    SELECT * FROM support_threads
    WHERE username = ? AND is_guest = 0 AND status = 'open'
    ORDER BY updated_at DESC LIMIT 1
  `);
  return stmt.get(username);
}

function getThreadById(threadId) {
  const stmt = db.prepare('SELECT * FROM support_threads WHERE thread_id = ?');
  return stmt.get(threadId);
}

function getThreadMessages(threadId) {
  const stmt = db.prepare('SELECT * FROM support_thread_messages WHERE thread_id = ? ORDER BY created_at ASC');
  return stmt.all(threadId);
}

function getAllThreads(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM support_threads
    ORDER BY (status = 'open') DESC, updated_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function resolveThread(threadId) {
  return db.prepare(`UPDATE support_threads SET status = 'resolved', updated_at = datetime('now') WHERE thread_id = ?`).run(threadId);
}

function countOpenThreads() {
  return db.prepare(`SELECT COUNT(*) AS c FROM support_threads WHERE status = 'open'`).get().c;
}

module.exports = {
  generateGuestToken,
  createThread,
  addMessage,
  findActiveThreadByGuest,
  findActiveThreadByUsername,
  getThreadById,
  getThreadMessages,
  getAllThreads,
  resolveThread,
  countOpenThreads
};

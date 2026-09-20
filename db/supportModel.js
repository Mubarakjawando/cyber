const db = require('./connection');

function createMessage({ userId, username, subject, message }) {
  const stmt = db.prepare(`
    INSERT INTO support_messages (user_id, username, subject, message)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(userId, username, subject, message);
}

function getMessagesByUsername(username) {
  const stmt = db.prepare(`
    SELECT * FROM support_messages WHERE username = ? ORDER BY created_at DESC
  `);
  return stmt.all(username);
}

function getAllMessages(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM support_messages
    ORDER BY (status = 'open') DESC, created_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

function getMessageById(id) {
  const stmt = db.prepare('SELECT * FROM support_messages WHERE message_id = ?');
  return stmt.get(id);
}

function replyToMessage(id, reply) {
  const stmt = db.prepare(`
    UPDATE support_messages
    SET admin_reply = ?, status = 'replied', replied_at = datetime('now')
    WHERE message_id = ?
  `);
  return stmt.run(reply, id);
}

function countOpenMessages() {
  const stmt = db.prepare(`SELECT COUNT(*) AS c FROM support_messages WHERE status = 'open'`);
  return stmt.get().c;
}

module.exports = { createMessage, getMessagesByUsername, getAllMessages, getMessageById, replyToMessage, countOpenMessages };

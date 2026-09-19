const db = require('./connection');

function findUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
}

function createUser(username, passwordHash, role = 'student', matricOrStaffNo = null, surname = null, firstName = null, lastName = null) {
  const stmt = db.prepare(`
    INSERT INTO users (username, password_hash, role, matric_or_staff_no, surname, first_name, last_name)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(username, passwordHash, role, matricOrStaffNo, surname, firstName, lastName);
}

function updateUserPassword(userId, newPasswordHash) {
  const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE user_id = ?');
  return stmt.run(newPasswordHash, userId);
}

module.exports = { findUserByUsername, createUser, updateUserPassword };

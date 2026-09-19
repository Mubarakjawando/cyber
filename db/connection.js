const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const config = require('../config/env');

const dbPath = path.resolve(__dirname, '..', config.dbPath);
const db = new DatabaseSync(dbPath);

// Enforce foreign key constraints
db.exec('PRAGMA foreign_keys = ON;');

module.exports = db;

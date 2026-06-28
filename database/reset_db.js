const Database = require('better-sqlite3');
const config = require('../config');
const { initializeDatabase, resetDatabase } = require('./init');

// Reset the on-disk database to seed state
const db = new Database(config.DB_PATH);
resetDatabase(db);
console.log('[DB] Reset to seeded state at', config.DB_PATH);

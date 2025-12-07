const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite for development (easier setup)
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  // SQLite setup for development
  const dbPath = path.join(__dirname, '../../db/zuri_dev.db');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
    } else {
      console.log('[DB] Connected to SQLite database');
    }
  });

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  module.exports = {
    db,
    dbConfig: { type: 'sqlite', path: dbPath }
  };
} else {
  // PostgreSQL setup for production
  const { Pool } = require('pg');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 54321,
    database: process.env.DB_NAME || 'zuri_lms',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  const pool = new Pool(dbConfig);

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err);
    process.exit(-1);
  });

  pool.on('connect', () => {
    console.log('[DB] New client connected to PostgreSQL database');
  });

  module.exports = {
    pool,
    dbConfig
  };
}
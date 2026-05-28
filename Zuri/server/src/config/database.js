const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { Pool } = require('pg');

// Use SQLite for development, Supabase (PostgreSQL) for production
const isProduction = process.env.NODE_ENV === 'production';
const useSupabase = process.env.USE_SUPABASE === 'true' || isProduction;

if (!useSupabase) {
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
  // Supabase PostgreSQL setup for production
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseDbUrl = process.env.SUPABASE_DB_URL || supabaseUrl;

  if (!supabaseDbUrl) {
    throw new Error('[DB] SUPABASE_URL or SUPABASE_DB_URL environment variable is required for production');
  }

  const dbConfig = {
    connectionString: supabaseDbUrl,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
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
    console.log('[DB] New client connected to Supabase PostgreSQL database');
  });

  module.exports = {
    pool,
    dbConfig: { type: 'supabase', url: supabaseDbUrl }
  };
}
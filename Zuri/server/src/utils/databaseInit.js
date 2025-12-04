const isProduction = process.env.NODE_ENV === 'production';

let db;
if (!isProduction) {
  // SQLite for development
  const { db: sqliteDb } = require('../config/database');
  db = sqliteDb;
} else {
  // PostgreSQL for production
  const { pool } = require('../config/database');
  db = pool;
}

// Database table normalization function
const normalize = (s) => {
  if (!s || typeof s !== 'string') return '';
  // Insert underscore between lower->Upper (camelCase to snake_case)
  let out = s.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  // Replace non-alphanumerics with underscores
  out = out.replace(/[^a-zA-Z0-9_]/g, '_');
  // Collapse multiple underscores and trim
  out = out.replace(/__+/g, '_').replace(/^_|_$/g, '');
  return out.toLowerCase();
};

// Ensure table exists with dynamic schema
const ensureTable = async (key, sampleRow) => {
  const keys = Object.keys(sampleRow);
  const normalizedCols = keys.map(k => normalize(k));

  if (!isProduction) {
    // SQLite implementation
    return new Promise((resolve, reject) => {
      // Check if table exists
      db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${key}'`, (err, row) => {
        if (err) {
          console.error(`[DB] ensureTable (check) failed for ${key}: ${err.message}`);
          reject(err);
          return;
        }

        if (!row) {
          // Create table
          const createQuery = `CREATE TABLE "${key}" (id INTEGER PRIMARY KEY AUTOINCREMENT)`;
          db.run(createQuery, (err) => {
            if (err) {
              console.error(`[DB] ensureTable (create) failed for ${key}: ${err.message}`);
              reject(err);
              return;
            }

            // Add columns
            let completed = 0;
            const total = normalizedCols.length;

            if (total === 0) {
              resolve();
              return;
            }

            normalizedCols.forEach(col => {
              const alterSql = `ALTER TABLE "${key}" ADD COLUMN "${col}" TEXT`;
              db.run(alterSql, (err) => {
                if (err && !err.message.includes('duplicate column')) {
                  console.error(`[DB] Adding column ${col} to ${key}: ${err.message}`);
                }
                completed++;
                if (completed === total) {
                  resolve();
                }
              });
            });
          });
        } else {
          // Check existing columns
          db.all(`PRAGMA table_info("${key}")`, (err, columns) => {
            if (err) {
              console.error(`[DB] ensureTable (pragma) failed for ${key}: ${err.message}`);
              reject(err);
              return;
            }

            const existing = columns.map(c => c.name);
            const toAdd = normalizedCols.filter(col => !existing.includes(col));

            if (toAdd.length === 0) {
              resolve();
              return;
            }

            let completed = 0;
            toAdd.forEach(col => {
              const alterSql = `ALTER TABLE "${key}" ADD COLUMN "${col}" TEXT`;
              db.run(alterSql, (err) => {
                if (err) {
                  console.error(`[DB] Adding missing column ${col} to ${key}: ${err.message}`);
                }
                completed++;
                if (completed === toAdd.length) {
                  resolve();
                }
              });
            });
          });
        }
      });
    });
  } else {
    // PostgreSQL implementation (existing code)
    const keys = Object.keys(sampleRow);
    const normalizedCols = keys.map(k => normalize(k));

    // Ensure table exists (create with only id if missing)
    const createQuery = `CREATE TABLE IF NOT EXISTS "${key}" (id SERIAL PRIMARY KEY)`;
    try {
      await db.query(createQuery);
    } catch (err) {
      console.error(`[DB] ensureTable (create) failed for ${key}: ${err.message}`);
      console.error(err.stack);
      throw err;
    }

    // Add any missing columns (as TEXT) using normalized column names
    try {
      const colRes = await db.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
        [key]
      );
      const existing = colRes.rows.map(r => r.column_name);
      for (const col of normalizedCols) {
        if (existing.includes(col)) continue;
        const alterSql = `ALTER TABLE "${key}" ADD COLUMN "${col}" TEXT`;
        console.log(`[DB] Adding missing column ${col} to ${key}`);
        await db.query(alterSql);
      }
    } catch (err) {
      console.error(`[DB] ensureTable (alter) failed for ${key}: ${err.message}`);
      console.error(err.stack);
      throw err;
    }
  }
};

// Initialize core database tables
const initializeTables = async () => {
  try {
    if (!isProduction) {
      // SQLite table creation
      const sqliteTables = [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'User',
          email TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          username TEXT NOT NULL,
          session_id TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          browser TEXT,
          browser_version TEXT,
          device TEXT,
          device_type TEXT,
          os TEXT,
          os_version TEXT,
          language TEXT,
          languages TEXT,
          screen_resolution TEXT,
          viewport_size TEXT,
          timezone TEXT,
          platform TEXT,
          cookie_enabled INTEGER,
          do_not_track TEXT,
          login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          logout_time DATETIME,
          session_duration INTEGER,
          is_active INTEGER DEFAULT 1
        )`,

        `CREATE TABLE IF NOT EXISTS activity_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          username TEXT NOT NULL,
          activity_type TEXT NOT NULL,
          activity_description TEXT,
          table_name TEXT,
          record_id INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          request_data TEXT,
          response_data TEXT,
          error_code TEXT,
          error_message TEXT,
          success INTEGER DEFAULT 1,
          client_info TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS inspections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          user_name TEXT,
          company_id INTEGER,
          depot_id INTEGER,
          inspection_date DATE,
          location TEXT,
          header TEXT,
          vehicles TEXT,
          timestamp TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS inspections_drafts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          draft_id TEXT NOT NULL,
          user_id INTEGER REFERENCES users(id),
          header TEXT,
          vehicles TEXT,
          last_saved DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(draft_id, user_id)
        )`,

        `CREATE TABLE IF NOT EXISTS user_drafts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          form_type TEXT NOT NULL,
          form_name TEXT NOT NULL,
          draft_data TEXT NOT NULL,
          sync_status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS scrap_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location TEXT NOT NULL,
          damage_code TEXT NOT NULL,
          damage_description TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(location, damage_code)
        )`,

        `CREATE TABLE IF NOT EXISTS scraps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          user_name TEXT,
          store_id INTEGER,
          items TEXT,
          status TEXT DEFAULT 'Draft',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          contact_name TEXT,
          email TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS depots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location TEXT NOT NULL,
          contact_name TEXT,
          email TEXT,
          phone TEXT,
          company_id INTEGER REFERENCES companies(id),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS tyres (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand TEXT,
          pattern TEXT,
          ply_rating TEXT,
          original_tread_depth TEXT,
          load_rating TEXT,
          load_rating_duals TEXT,
          load_rating_singles TEXT,
          speed_rating_duals TEXT,
          speed_rating_singles TEXT,
          tube_rating TEXT,
          nominal_section_width TEXT,
          aspect_ratio TEXT,
          rim_size TEXT,
          product_code TEXT,
          depth_inner NUMERIC,
          depth_middle NUMERIC,
          depth_outer NUMERIC,
          comments TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(brand, pattern, nominal_section_width, aspect_ratio, rim_size)
        )`,

        `CREATE TABLE IF NOT EXISTS vehicle_configurations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          code TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          axle_count INTEGER,
          tire_count INTEGER,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS vehicle_configs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          item_code TEXT UNIQUE,
          name TEXT,
          tire_config TEXT,
          tire_sizes TEXT,
          ideal_pressures TEXT,
          pressure_units TEXT,
          spares INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS user_suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          username TEXT NOT NULL,
          suggestion_type TEXT NOT NULL,
          suggestion_data TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          admin_reviewed_by TEXT,
          admin_reviewed_at DATETIME,
          admin_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS user_suggestions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER REFERENCES users(id),
          username TEXT NOT NULL,
          suggestion_type TEXT NOT NULL,
          suggestion_data TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          admin_reviewed_by TEXT,
          admin_reviewed_at DATETIME,
          admin_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Geographic data tables for user management
        `CREATE TABLE IF NOT EXISTS countries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          code TEXT NOT NULL UNIQUE,
          is_sadc INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        `CREATE TABLE IF NOT EXISTS provinces (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, country_id)
        )`,

        `CREATE TABLE IF NOT EXISTS regions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          province_id INTEGER NOT NULL REFERENCES provinces(id) ON DELETE CASCADE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(name, province_id)
        )`,

        `CREATE TABLE IF NOT EXISTS stores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT NOT NULL UNIQUE,
          region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
          address TEXT,
          phone TEXT,
          manager_name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

        // Extended users table with geographic and profile data
        `CREATE TABLE IF NOT EXISTS users_extended (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          phone TEXT,
          employee_id TEXT UNIQUE,
          country_id INTEGER REFERENCES countries(id),
          province_id INTEGER REFERENCES provinces(id),
          region_id INTEGER REFERENCES regions(id),
          store_id INTEGER REFERENCES stores(id),
          security_question_1 TEXT NOT NULL,
          security_answer_1_hash TEXT NOT NULL,
          security_question_2 TEXT NOT NULL,
          security_answer_2_hash TEXT NOT NULL,
          is_active INTEGER DEFAULT 1,
          last_login DATETIME,
          password_changed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ];

      // Execute SQLite table creation
      for (const sql of sqliteTables) {
        await new Promise((resolve, reject) => {
          db.run(sql, (err) => {
            if (err) {
              console.error('[DB_INIT] SQLite table creation failed:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      // Seed scrap_data table
      const scrapDataRecords = [
        { location: 'TREAD', code: 'TR-1', description: 'Puncture/Cut (To Interior)' },
        { location: 'TREAD', code: 'TR-2', description: 'Puncture/Cut (Not To Interior)' },
        { location: 'TREAD', code: 'TR-3', description: 'Chipping/Chunking' },
        { location: 'SHOULDER', code: 'SH-1', description: 'Puncture/Cut (To Interior)' },
        { location: 'SIDEWALL', code: 'SW-1', description: 'Puncture/Cut (To Interior)' },
        { location: 'BEAD', code: 'BD-1', description: 'Cut' },
        { location: 'INTERIOR', code: 'IN-1', description: 'Cut' },
        { location: 'GENERAL', code: 'GN-1', description: 'Improper Repair' }
      ];

      for (const damage of scrapDataRecords) {
        await new Promise((resolve, reject) => {
          db.run(
            'INSERT OR IGNORE INTO scrap_data (location, damage_code, damage_description) VALUES (?, ?, ?)',
            [damage.location, damage.code, damage.description],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      // Seed tyres table
      const tyresRecords = [
        { brand: 'Michelin', pattern: 'X Multi HDD', ply_rating: '18PR', original_tread_depth: '22.5', load_rating: '156/150', load_rating_duals: '156', load_rating_singles: '150', speed_rating_duals: 'K', speed_rating_singles: 'L', tube_rating: 'TL', nominal_section_width: '315', aspect_ratio: '65', rim_size: '22.5' },
        { brand: 'Bridgestone', pattern: 'M840', ply_rating: '16PR', original_tread_depth: '16.5', load_rating: '150/145', load_rating_duals: '150', load_rating_singles: '145', speed_rating_duals: 'J', speed_rating_singles: 'K', tube_rating: 'TL', nominal_section_width: '295', aspect_ratio: '80', rim_size: '22.5' }
      ];

      for (const tyre of tyresRecords) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT OR IGNORE INTO tyres (brand, pattern, ply_rating, original_tread_depth, load_rating, load_rating_duals, load_rating_singles, speed_rating_duals, speed_rating_singles, tube_rating, nominal_section_width, aspect_ratio, rim_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [tyre.brand, tyre.pattern, tyre.ply_rating, tyre.original_tread_depth, tyre.load_rating, tyre.load_rating_duals, tyre.load_rating_singles, tyre.speed_rating_duals, tyre.speed_rating_singles, tyre.tube_rating, tyre.nominal_section_width, tyre.aspect_ratio, tyre.rim_size],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

    } else {
      // PostgreSQL implementation (keep existing code)
      const coreTables = [
        // ... existing PostgreSQL table creation code ...
      ];

      // Execute table creation
      for (const sql of coreTables) {
        await db.query(sql);
      }

      // Create indexes for better performance
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_inspections_user_id ON inspections(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at)',
        'CREATE INDEX IF NOT EXISTS idx_scraps_user_id ON scraps(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_drafts_user_id ON user_drafts(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_suggestions_status ON user_suggestions(status)',
        'CREATE INDEX IF NOT EXISTS idx_user_suggestions_user_id ON user_suggestions(user_id)'
      ];

      for (const sql of indexes) {
        await db.query(sql);
      }
    }

    console.log('[DB_INIT] All core tables and indexes created successfully');

  } catch (err) {
    console.error('[DB_INIT] Error initializing tables:', err);
    throw err;
  }
};

module.exports = {
  normalize,
  ensureTable,
  initializeTables
};
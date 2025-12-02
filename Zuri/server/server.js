// ZURI TIRE INSPECTION - FULL BACKEND (Auth, Stats, Utilities, Export, Role Security)
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Parser } = require('json2csv');
const resetPasswordRoute = require('./routes/resetPassword');
const resetConfirmRoute = require('./routes/resetConfirm');

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];

const app = express();
const PORT = 5000;

// Simple request logger (method, url, ip, timestamp)
// (Replaced by enhanced session-based logger above)


// PostgreSQL setup (read from env with sensible defaults)
const dbConfig = {
  user: process.env.PGUSER || process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'zuri',
  password: process.env.PGPASSWORD || '1234',
  port: Number(process.env.PGPORT) || 54321,
};
const pool = new Pool(dbConfig);

// Log DB config (without password) and check connectivity on startup
console.log(`[DB] Using Postgres config: user=${dbConfig.user} host=${dbConfig.host} port=${dbConfig.port} database=${dbConfig.database}`);
async function checkDb() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('[DB] Connected to Postgres, now=', res.rows[0].now);
    // Run migrations to ensure required tables exist
    await runMigrations();
  } catch (err) {
    console.error('[DB] Failed to connect to Postgres:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}
checkDb();

// Simple migration runner: ensure 'scraps' table exists with appropriate schema
async function runMigrations() {
  try {
    console.log('[DB] Running migrations...');
    const createScrapsSql = `
      CREATE TABLE IF NOT EXISTS "scraps" (
        id SERIAL PRIMARY KEY,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        location TEXT,
        report_date TEXT,
        status TEXT,
        items JSONB,
        user_id INTEGER,
        user_name TEXT,
        store_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createScrapsSql);
    console.log('[DB] migrations complete');
  } catch (err) {
    console.error('[DB] Migration failed:', err.message);
    console.error(err.stack);
    throw err;
  }
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('[LOG] Created logs directory:', logsDir);
}

// User-based file logger (persists logs by username)
const getUserLogDir = (username) => {
  const sanitized = (username || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(logsDir, sanitized);
};

const ensureUserLogDir = (username) => {
  const userDir = getUserLogDir(username);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

const getUserLogFile = (username) => {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const userDir = ensureUserLogDir(username);
  const filename = `activity_${dateStr}.log`;
  return path.join(userDir, filename);
};

const logToFile = (username, message) => {
  if (!username) return; // Skip if no user
  try {
    const logFile = getUserLogFile(username);
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (err) {
    console.error(`[LOG] Failed to write user log for ${username}:`, err.message);
  }
};

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow non-browser tools like Postman
    const cleanedOrigin = origin.trim().toLowerCase();
    if (allowedOrigins.includes(cleanedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.static('uploads'));
app.use(session({
  secret: 'zuri_secret_key',
  resave: false,
  saveUninitialized: false,
}));

// Attach username to request for logging (from session if authenticated)
app.use((req, res, next) => {
  req.logUsername = req.session?.user?.username || 'anonymous';
  next();
});

// Enhanced request logger: console + file (per user)
app.use((req, res, next) => {
  const time = new Date().toISOString();
  const bodySize = req.body && Object.keys(req.body).length ? Object.keys(req.body).length : 0;
  const logMsg = `${req.method} ${req.originalUrl} from ${req.ip} bodyKeys=${bodySize}`;
  
  console.log(`[REQ] ${time} - ${logMsg}`);
  logToFile(req.logUsername, `[REQ] ${req.method} ${req.originalUrl} from ${req.ip} bodyKeys=${bodySize}`);
  
  // Capture response status and log on end
  const originalSend = res.send;
  res.send = function(data) {
    logToFile(req.logUsername, `[RES] ${req.method} ${req.originalUrl} status=${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});
app.use('/api/reset-password', resetPasswordRoute);
app.use('/api/reset-password/confirm', resetConfirmRoute);

// Multer storage config for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, unique + ext);
  }
});
const upload = multer({ storage });

// Normalize keys: convert camelCase to snake_case, remove unsafe chars, lowercase
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

// POST /upload - accepts multipart/form-data field `photo`
app.post('/upload', upload.single('photo'), (req, res) => {
  const time = new Date().toISOString();
  if (!req.file) {
    const msg = `No file received`;
    console.warn(`[UPLOAD] ${time} - ${msg}`);
    logToFile(req.logUsername, `[UPLOAD] ${msg}`);
    return res.status(400).json({ error: 'No file uploaded. Make sure the form field is named `photo`.' });
  }
  try {
    const msg = `Received file ${req.file.originalname} -> ${req.file.filename} (${req.file.size} bytes)`;
    console.log(`[UPLOAD] ${time} - ${msg}`);
    logToFile(req.logUsername, `[UPLOAD] ${msg}`);
    const fileUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
    return res.json({ path: fileUrl });
  } catch (err) {
    const msg = `Error saving file: ${err.message}`;
    console.error(`[UPLOAD] ${time} - ${msg}`);
    logToFile(req.logUsername, `[UPLOAD] ${msg}`);
    return res.status(500).json({ error: 'Failed to save uploaded file', details: err.message });
  }
});

// POST /inspections - accept inspection data and save to Postgres (creates table if missing)
app.post('/inspections', async (req, res) => {
  const time = new Date().toISOString();
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      const msg = `Empty payload`;
      console.warn(`[INSPECT] ${time} - ${msg}`);
      logToFile(req.logUsername, `[INSPECT] ${msg}`);
      return res.status(400).json({ error: 'No inspection data provided' });
    }

    const msg = `Saving inspection for vehicleId=${data.vehicleId || 'N/A'}`;
    console.log(`[INSPECT] ${time} - ${msg}`);
    logToFile(req.logUsername, `[INSPECT] ${msg}`);
    await ensureTable('inspections', data);

    const cols = Object.keys(data);
    const values = Object.values(data);
    const normalizedCols = cols.map(c => normalize(c));
    const placeholders = cols.map((_, i) => `$${i + 1}`);

    const insertSql = `INSERT INTO "inspections" (${normalizedCols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
    try {
      await pool.query(insertSql, values);
    } catch (sqlErr) {
      console.error(`[DB] Insert failed. SQL=${insertSql} values=${JSON.stringify(values)} err=${sqlErr.message}`);
      logToFile(req.logUsername, `[DB] Insert failed: ${sqlErr.message}`);
      console.error(sqlErr.stack);
      throw sqlErr;
    }

    const successMsg = `Inspection saved successfully`;
    console.log(`[INSPECT] ${time} - ${successMsg}`);
    logToFile(req.logUsername, `[INSPECT] ${successMsg}`);
    res.status(200).json({ message: 'Inspection saved' });
  } catch (err) {
    const errMsg = `Save inspection failed: ${err.message}`;
    console.error(`[INSPECT] ${time} - ${errMsg}`);
    logToFile(req.logUsername, `[INSPECT] ${errMsg}`);
    res.status(500).json({ error: 'Failed to save inspection', details: err.message });
  }
});

// Centralized error handler (returns JSON)
app.use((err, req, res, next) => {
  const time = new Date().toISOString();
  const logMsg = `[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`;
  console.error(`${logMsg}`);
  logToFile(req.logUsername, logMsg);
  console.error(err.stack);
  logToFile(req.logUsername, err.stack);
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
  res.status(status).json(payload);
});

// Auth Middleware
function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'Administrator') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

// Auth Routes
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    res.json({ message: 'Logged in', user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// Table utilities
async function ensureTable(key, sampleRow) {
  const keys = Object.keys(sampleRow);
  const normalizedCols = keys.map(k => normalize(k));

  // Ensure table exists (create with only id if missing)
  const createQuery = `CREATE TABLE IF NOT EXISTS "${key}" (id SERIAL PRIMARY KEY)`;
  try {
    await pool.query(createQuery);
  } catch (err) {
    console.error(`[DB] ensureTable (create) failed for ${key}: ${err.message}`);
    console.error(err.stack);
    throw err;
  }

  // Add any missing columns (as TEXT) using normalized column names
  try {
    const colRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [key]
    );
    const existing = colRes.rows.map(r => r.column_name);
    for (const col of normalizedCols) {
      if (existing.includes(col)) continue;
      const alterSql = `ALTER TABLE "${key}" ADD COLUMN "${col}" TEXT`;
      console.log(`[DB] Adding missing column ${col} to ${key}`);
      await pool.query(alterSql);
    }
  } catch (err) {
    console.error(`[DB] ensureTable (alter) failed for ${key}: ${err.message}`);
    console.error(err.stack);
    throw err;
  }
}

// CRUD
app.get('/api/table/:key', requireLogin, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM "${req.params.key}"`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/table/:key', requireAdmin, async (req, res) => {
  const key = req.params.key;
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }
  try {
    await ensureTable(key, data[0]);
    await pool.query(`DELETE FROM "${key}"`);
    for (const row of data) {
      const cols = Object.keys(row);
      const values = Object.values(row);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      await pool.query(`INSERT INTO "${key}" (${cols.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders.join(', ')})`, values);
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/table/:key', requireAdmin, async (req, res) => {
  try {
    await pool.query(`DROP TABLE IF EXISTS "${req.params.key}"`);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Utility: Clear Table Only
app.delete('/clear/:key', requireAdmin, async (req, res) => {
  try {
    await pool.query(`DELETE FROM "${req.params.key}"`);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Scrap endpoints (authenticated users) ---------------------------------
// GET /api/scraps - returns scraps filtered by role
app.get('/api/scraps', requireLogin, async (req, res) => {
  try {
    // ensure table exists (safe no-op if present)
    await ensureTable('scraps', { placeholder: 'x' });

    let sql = `SELECT * FROM "scraps"`;
    const params = [];

    // Apply basic role-based filtering
    const role = req.session.user?.role;
    if (role === 'Administrator' || role === 'Group Manager') {
      // no filter
    } else if (role === 'Store Manager') {
      sql += ` WHERE store_id = $1`;
      params.push(req.session.user.storeId || null);
    } else {
      sql += ` WHERE user_id = $1`;
      params.push(req.session.user.id);
    }

    const { rows } = await pool.query(sql, params);
    
    // Parse JSON items field for each row
    const parsedRows = rows.map(row => {
      if (row.items && typeof row.items === 'string') {
        try {
          row.items = JSON.parse(row.items);
        } catch (e) {
          console.warn('[SCRAP] Failed to parse items JSON for report', row.id, ':', e.message);
        }
      }
      return row;
    });
    
    res.json(parsedRows);
  } catch (err) {
    console.error('[SCRAP] GET failed:', err.message);
    console.error(err.stack);
    res.status(500).json({ error: err.message, code: 'ERR_SCRAP_FETCH_FAILED' });
  }
});

// POST /api/scraps - create or update a single scrap report
app.post('/api/scraps', requireLogin, async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    // Attach metadata from session (only if not already set)
    const userId = req.session.user.id;
    const userName = req.session.user.username;
    const storeId = req.session.user.storeId || null;
    payload.user_id = payload.user_id || userId;
    payload.user_name = payload.user_name || userName;
    payload.store_id = payload.store_id || storeId;
    payload.updated_at = new Date().toISOString();
    if (!payload.created_at) payload.created_at = payload.updated_at;

    // Ensure table and columns exist (pass sanitized payload without id)
    const sampleForMigration = { ...payload };
    delete sampleForMigration.id;
    await ensureTable('scraps', sampleForMigration);

    // If updating (id present) -> validate ownership / status
    if (payload.id) {
      const id = payload.id;
      const existing = await pool.query('SELECT * FROM "scraps" WHERE id = $1', [id]);
      const row = existing.rows[0];
      if (!row) return res.status(404).json({ error: 'Scrap not found' });

      // Prevent updates to completed records by non-admins
      if (row.status === 'Complete' && req.session.user.role !== 'Administrator') {
        return res.status(403).json({ error: 'Cannot modify a completed scrap' });
      }

      // Only owner or admin or group manager/store manager with matching store can update
      const role = req.session.user.role;
      if (req.session.user.id !== Number(row.user_id) && role !== 'Administrator' && role !== 'Group Manager') {
        if (role === 'Store Manager' && String(row.store_id) === String(req.session.user.storeId)) {
          // allowed
        } else {
          return res.status(403).json({ error: 'Not authorized to update this scrap' });
        }
      }

      // Build update - exclude 'id' from update columns and deduplicate
      const updatePayload = { ...payload };
      delete updatePayload.id;
      
      // Convert items array to JSON string if present
      if (updatePayload.items && Array.isArray(updatePayload.items)) {
        updatePayload.items = JSON.stringify(updatePayload.items);
      }
      
      const updateCols = Object.keys(updatePayload);
      
      // Deduplicate: build map of normalized -> original to avoid duplicate keys
      const colMap = {};
      const normalizedValues = [];
      for (const col of updateCols) {
        const norm = normalize(col);
        if (!colMap[norm]) {
          colMap[norm] = updatePayload[col];
          normalizedValues.push({ norm, val: updatePayload[col] });
        }
      }
      
      const setSql = normalizedValues.map((item, i) => `"${item.norm}" = $${i + 1}`).join(', ');
      const values = normalizedValues.map(item => item.val);
      const sql = `UPDATE "scraps" SET ${setSql} WHERE id = $${values.length + 1}`;
      values.push(id);
      await pool.query(sql, values);

      return res.json({ message: 'Scrap updated' });
    }

    // Insert new scrap - deduplicate columns by normalized key and filter null/undefined
    const insertPayload = { ...payload };
    delete insertPayload.id;
    
    // Convert items array to JSON string if present
    if (insertPayload.items && Array.isArray(insertPayload.items)) {
      insertPayload.items = JSON.stringify(insertPayload.items);
    }
    
    // Build set of (normalized_col, value) pairs, skipping nulls/undefined
    const colMap = {};
    const colsToInsert = [];
    
    for (const col of Object.keys(insertPayload)) {
      const val = insertPayload[col];
      // Skip null, undefined, and empty strings
      if (val === null || val === undefined || val === '') continue;
      
      const norm = normalize(col);
      if (!colMap[norm]) {
        colMap[norm] = val;
        colsToInsert.push({ orig: col, norm, val });
      }
    }
    
    // If no columns to insert, reject
    if (colsToInsert.length === 0) {
      return res.status(400).json({ error: 'No valid data to insert', code: 'ERR_SCRAP_NO_DATA' });
    }
    
    const normalizedCols = colsToInsert.map(c => c.norm);
    const values = colsToInsert.map(c => c.val);
    const placeholders = values.map((_, i) => `$${i + 1}`);
    const insertSql = `INSERT INTO "scraps" (${normalizedCols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    
    console.log('[SCRAP] INSERT SQL:', insertSql);
    console.log('[SCRAP] Values:', values);
    const insertRes = await pool.query(insertSql, values);
    res.status(201).json(insertRes.rows[0]);

  } catch (err) {
    console.error('[SCRAP] POST failed:', err.message);
    console.error(err.stack);
    const code = err.message.includes('column') ? 'ERR_SCRAP_COLUMN_ISSUE' : 'ERR_SCRAP_SAVE_FAILED';
    res.status(500).json({ error: err.message, code, details: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
});


// Export Data
app.get('/export/:key', requireLogin, async (req, res) => {
  try {
    const type = req.query.type || 'json';
    const { rows } = await pool.query(`SELECT * FROM "${req.params.key}"`);
    if (type === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${req.params.key}.csv`);
      return res.send(csv);
    } else {
      res.json(rows);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics
app.get('/api/stats', requireLogin, async (req, res) => {
  try {
    const tyreToday = await pool.query("SELECT COUNT(*) FROM tyres WHERE CURRENT_DATE = DATE(timestamp)");
    const vehicleTotal = await pool.query("SELECT COUNT(*) FROM vehicles");
    res.json({
      tyres_today: Number(tyreToday.rows[0].count),
      total_vehicles: Number(vehicleTotal.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zuri backend running at http://localhost:${PORT}`);
});

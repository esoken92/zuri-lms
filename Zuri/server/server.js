// ZURI TIRE INSPECTION - FULL BACKEND (Auth, Stats, Utilities, Export, Role Security)
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const { Parser } = require('json2csv');

const app = express();
const PORT = 5000;

// PostgreSQL setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'zuri',
  password: 'zuri1234',
  port: 54321,
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static('uploads'));
app.use(session({
  secret: 'zuri_secret_key',
  resave: false,
  saveUninitialized: false,
}));

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
  const columns = keys.map(k => `"${k.replace(/[^a-zA-Z0-9_]/g, '')}" TEXT`).join(', ');
  const query = `CREATE TABLE IF NOT EXISTS "${key}" (id SERIAL PRIMARY KEY, ${columns})`;
  await pool.query(query);
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

const { pool } = require('../config/database');
const { Parser } = require('json2csv');
const { logActivity } = require('../utils/activityLogger');
const { getClientIp } = require('../utils/clientInfo');

// Whitelist of allowed tables for dynamic access (security: prevent access to system tables)
const ALLOWED_DYNAMIC_TABLES = ['scraps', 'inspections', 'companies', 'depots', 'vehicle_configs', 'tyres', 'vehicles'];

const validateTableAccess = (key) => {
  if (!ALLOWED_DYNAMIC_TABLES.includes(key)) {
    throw new Error(`Access denied to table: ${key}. Not in whitelist.`);
  }
};

// Get table data
const getTable = async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    const { rows } = await pool.query(`SELECT * FROM "${req.params.key}"`);
    res.json(rows);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// Bulk upload to table
const bulkUploadTable = async (req, res) => {
  const key = req.params.key;
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }
  try {
    validateTableAccess(key);
    await pool.query(`DELETE FROM "${key}"`);
    for (const row of data) {
      const cols = Object.keys(row);
      const values = Object.values(row);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      await pool.query(`INSERT INTO "${key}" (${cols.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders.join(', ')})`, values);
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// Drop table
const dropTable = async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    await pool.query(`DROP TABLE IF EXISTS "${req.params.key}"`);
    res.sendStatus(200);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// Clear table contents
const clearTable = async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    await pool.query(`DELETE FROM "${req.params.key}"`);
    res.sendStatus(200);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
};

// Export table data
const exportTable = async (req, res) => {
  try {
    validateTableAccess(req.params.key);
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
    res.status(403).json({ error: err.message });
  }
};

// Stats endpoint
const getStats = async (req, res) => {
  try {
    const tyreToday = await pool.query("SELECT COUNT(*) FROM tyres WHERE CURRENT_DATE = DATE(created_at)");
    const vehicleTotal = await pool.query("SELECT COUNT(*) FROM vehicles");
    res.json({
      tyres_today: Number(tyreToday.rows[0].count),
      total_vehicles: Number(vehicleTotal.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getTable,
  bulkUploadTable,
  dropTable,
  clearTable,
  exportTable,
  getStats
};
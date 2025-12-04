const { ensureTable } = require('../../utils/databaseInit');

// Legacy inspection creation (for backward compatibility)
const createLegacyInspection = async (req, res) => {
  const time = new Date().toISOString();
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      const msg = `Empty payload`;
      console.warn(`[INSPECT] ${time} - ${msg}`);
      return res.status(400).json({ error: 'No inspection data provided' });
    }

    const msg = `Saving inspection for vehicleId=${data.vehicleId || 'N/A'}`;
    console.log(`[INSPECT] ${time} - ${msg}`);
    await ensureTable('inspections', data);

    const cols = Object.keys(data);
    const values = Object.values(data);
    const placeholders = cols.map((_, i) => `$${i + 1}`);

    const insertSql = `INSERT INTO "inspections" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
    const { pool } = require('../../config/database');
    await pool.query(insertSql, values);

    const successMsg = `Inspection saved successfully`;
    console.log(`[INSPECT] ${time} - ${successMsg}`);
    res.status(200).json({ message: 'Inspection saved' });
  } catch (err) {
    const errMsg = `Save inspection failed: ${err.message}`;
    console.error(`[INSPECT] ${time} - ${errMsg}`);
    res.status(500).json({ error: 'Failed to save inspection', details: err.message });
  }
};

module.exports = {
  createLegacyInspection
};
const { pool } = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { getClientIp } = require('../utils/clientInfo');
const { ensureTable } = require('../utils/databaseInit');

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
    try {
      await pool.query(insertSql, values);
    } catch (sqlErr) {
      console.error(`[DB] Insert failed. SQL=${insertSql} values=${JSON.stringify(values)} err=${sqlErr.message}`);
      throw sqlErr;
    }

    const successMsg = `Inspection saved successfully`;
    console.log(`[INSPECT] ${time} - ${successMsg}`);
    res.status(200).json({ message: 'Inspection saved' });
  } catch (err) {
    const errMsg = `Save inspection failed: ${err.message}`;
    console.error(`[INSPECT] ${time} - ${errMsg}`);
    res.status(500).json({ error: 'Failed to save inspection', details: err.message });
  }
};

// Multi-vehicle inspection creation
const createInspection = async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  try {
    const { header, vehicles, timestamp } = req.body;

    // Validate required fields
    if (!header || !vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({ error: 'Invalid inspection data: header and vehicles array required' });
    }

    if (!header.companyId || !header.depotId || !header.date || !header.location) {
      return res.status(400).json({ error: 'Missing required header fields: companyId, depotId, date, location' });
    }

    // Insert into inspections table (dynamic schema)
    const inspectionData = {
      user_id: user.id,
      user_name: user.username,
      company_id: header.companyId,
      depot_id: header.depotId,
      inspection_date: header.date,
      location: header.location,
      header: JSON.stringify(header),
      vehicles: JSON.stringify(vehicles),
      timestamp,
      created_at: new Date().toISOString(),
    };

    const cols = Object.keys(inspectionData);
    const values = Object.values(inspectionData);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const insertSql = `INSERT INTO "inspections" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;

    const result = await pool.query(insertSql, values);
    const inspectionId = result.rows[0].id;

    // Log activity
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'INSPECTION_SUBMITTED',
      activityDescription: `Submitted multi-vehicle inspection with ${vehicles.length} vehicle(s)`,
      tableName: 'inspections',
      recordId: inspectionId,
      ipAddress,
      userAgent,
      requestData: { vehicleCount: vehicles.length, location: header.location },
      success: true
    });

    res.status(201).json({
      message: 'Inspection submitted successfully',
      inspectionId,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[INSPECT] POST /api/inspections failed:', err.message);
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'INSPECTION_SUBMIT_ERROR',
      activityDescription: `Failed to submit inspection: ${err.message}`,
      tableName: 'inspections',
      ipAddress,
      userAgent,
      errorCode: 'INSPECT_SUBMIT_FAILED',
      errorMessage: err.message,
      success: false
    });
    res.status(500).json({ error: 'Failed to submit inspection', details: err.message });
  }
};

// Get inspections with role-based filtering
const getInspections = async (req, res) => {
  try {
    let query = 'SELECT * FROM inspections WHERE 1=1';
    const params = [];

    // Filter by user role
    if (req.session.user.role !== 'Administrator' && req.session.user.role !== 'Group Manager') {
      query += ' AND user_id = $1';
      params.push(req.session.user.id);
    }

    query += ' ORDER BY created_at DESC LIMIT 500';
    const result = await pool.query(query, params);

    // Parse JSON fields
    const inspections = result.rows.map(row => ({
      ...row,
      header: typeof row.header === 'string' ? JSON.parse(row.header) : row.header,
      vehicles: typeof row.vehicles === 'string' ? JSON.parse(row.vehicles) : row.vehicles,
    }));

    res.json(inspections);
  } catch (err) {
    console.error('[INSPECT] GET /api/inspections failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch inspections', details: err.message });
  }
};

// Get specific inspection
const getInspectionById = async (req, res) => {
  try {
    let query = 'SELECT * FROM inspections WHERE id = $1';
    const params = [req.params.id];

    // Add user filter if not admin
    if (req.session.user.role !== 'Administrator' && req.session.user.role !== 'Group Manager') {
      query += ' AND user_id = $2';
      params.push(req.session.user.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const row = result.rows[0];
    const inspection = {
      ...row,
      header: typeof row.header === 'string' ? JSON.parse(row.header) : row.header,
      vehicles: typeof row.vehicles === 'string' ? JSON.parse(row.vehicles) : row.vehicles,
    };

    res.json(inspection);
  } catch (err) {
    console.error('[INSPECT] GET /api/inspections/:id failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch inspection', details: err.message });
  }
};

module.exports = {
  createLegacyInspection,
  createInspection,
  getInspections,
  getInspectionById
};
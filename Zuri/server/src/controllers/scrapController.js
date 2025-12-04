const { pool } = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { getClientIp } = require('../utils/clientInfo');
const { ensureTable, normalize } = require('../utils/databaseInit');

// Get all scraps for authenticated user
const getScraps = async (req, res) => {
  try {
    // Ensure table exists (safe no-op if present)
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
};

// Create or update a scrap report
const createOrUpdateScrap = async (req, res) => {
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
};

module.exports = {
  getScraps,
  createOrUpdateScrap
};
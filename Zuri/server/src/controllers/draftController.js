const { pool } = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { getClientIp } = require('../utils/clientInfo');

// Create new inspection draft
const createInspectionDraft = async (req, res) => {
  const user = req.session.user;

  try {
    const { draftId, header, vehicles } = req.body;

    if (!draftId || !header || !vehicles) {
      return res.status(400).json({ error: 'Missing required fields: draftId, header, vehicles' });
    }

    // Check if draft exists
    const existing = await pool.query(
      'SELECT id FROM inspections_drafts WHERE draft_id = $1',
      [draftId]
    );

    if (existing.rows.length > 0) {
      // Update existing draft
      await pool.query(
        'UPDATE inspections_drafts SET header = $1, vehicles = $2, last_saved = NOW() WHERE draft_id = $3 AND user_id = $4',
        [JSON.stringify(header), JSON.stringify(vehicles), draftId, user.id]
      );
    } else {
      // Create new draft
      await pool.query(
        'INSERT INTO inspections_drafts (draft_id, user_id, header, vehicles) VALUES ($1, $2, $3, $4)',
        [draftId, user.id, JSON.stringify(header), JSON.stringify(vehicles)]
      );
    }

    res.json({ message: 'Draft saved', draftId, lastSaved: new Date().toISOString() });
  } catch (err) {
    console.error('[DRAFT] POST /api/drafts/inspection failed:', err.message);
    res.status(500).json({ error: 'Failed to save draft', details: err.message });
  }
};

// Retrieve inspection draft
const getInspectionDraft = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inspections_drafts WHERE draft_id = $1 AND user_id = $2',
      [req.params.draftId, req.session.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const draft = result.rows[0];
    draft.header = typeof draft.header === 'string' ? JSON.parse(draft.header) : draft.header;
    draft.vehicles = typeof draft.vehicles === 'string' ? JSON.parse(draft.vehicles) : draft.vehicles;

    res.json(draft);
  } catch (err) {
    console.error('[DRAFT] GET /api/drafts/inspection/:draftId failed:', err.message);
    res.status(500).json({ error: 'Failed to retrieve draft', details: err.message });
  }
};

// Delete inspection draft
const deleteInspectionDraft = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM inspections_drafts WHERE draft_id = $1 AND user_id = $2',
      [req.params.draftId, req.session.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ message: 'Draft deleted' });
  } catch (err) {
    console.error('[DRAFT] DELETE /api/drafts/inspection/:draftId failed:', err.message);
    res.status(500).json({ error: 'Failed to delete draft', details: err.message });
  }
};

// Get vehicle configurations
const getVehicleConfigurations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicle_configurations WHERE status = $1 ORDER BY code',
      ['approved']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[CONFIG] GET /api/table/vehicle-configurations failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch configurations', details: err.message });
  }
};

module.exports = {
  createInspectionDraft,
  getInspectionDraft,
  deleteInspectionDraft,
  getVehicleConfigurations
};
const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const {
  createInspectionDraft,
  getInspectionDraft,
  deleteInspectionDraft,
  getVehicleConfigurations
} = require('../controllers/draftController');

// POST /api/drafts/inspection - Create/update inspection draft
router.post('/inspection', requireLogin, createInspectionDraft);

// GET /api/drafts/inspection/:draftId - Get inspection draft
router.get('/inspection/:draftId', requireLogin, getInspectionDraft);

// DELETE /api/drafts/inspection/:draftId - Delete inspection draft
router.delete('/inspection/:draftId', requireLogin, deleteInspectionDraft);

// GET /api/drafts/vehicle-configurations - Get vehicle configurations
router.get('/vehicle-configurations', requireLogin, getVehicleConfigurations);

module.exports = router;
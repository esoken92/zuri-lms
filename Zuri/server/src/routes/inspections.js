const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const {
  createInspection,
  getInspections,
  getInspectionById
} = require('../controllers/inspectionController');

// POST /api/inspections - Create new inspection
router.post('/', requireLogin, createInspection);

// GET /api/inspections - Get all inspections
router.get('/', requireLogin, getInspections);

// GET /api/inspections/:id - Get specific inspection
router.get('/:id', requireLogin, getInspectionById);

module.exports = router;
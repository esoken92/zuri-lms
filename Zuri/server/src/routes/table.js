const express = require('express');
const router = express.Router();
const { requireLogin, requireAdmin } = require('../middleware/auth');
const {
  getTable,
  bulkUploadTable,
  dropTable,
  clearTable,
  exportTable
} = require('../controllers/tableController');

// GET /api/table/:key - Get table data
router.get('/:key', requireLogin, getTable);

// POST /api/table/:key - Bulk upload to table
router.post('/:key', requireAdmin, bulkUploadTable);

// DELETE /api/table/:key - Drop table
router.delete('/:key', requireAdmin, dropTable);

// DELETE /api/table/clear/:key - Clear table contents
router.delete('/clear/:key', requireAdmin, clearTable);

// GET /api/table/export/:key - Export table data
router.get('/export/:key', requireLogin, exportTable);

module.exports = router;
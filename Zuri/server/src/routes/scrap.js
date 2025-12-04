const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const { getScraps, createOrUpdateScrap } = require('../controllers/scrapController');

// GET /api/scraps - Get all scraps for authenticated user
router.get('/', requireLogin, getScraps);

// POST /api/scraps - Create or update scrap report
router.post('/', requireLogin, createOrUpdateScrap);

module.exports = router;
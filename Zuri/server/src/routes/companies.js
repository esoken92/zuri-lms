const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');

// Placeholder - to be implemented
router.get('/', requireLogin, (req, res) => {
  res.json({ message: 'Company routes - to be implemented' });
});

module.exports = router;
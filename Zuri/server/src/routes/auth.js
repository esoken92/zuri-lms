const express = require('express');
const router = express.Router();
const { login, logout, devLogin } = require('../controllers/authController');
const { requireDeveloperMode } = require('../config/developerMode');

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/logout
router.post('/logout', logout);

// POST /api/auth/dev-login (developer mode only)
router.post('/dev-login', requireDeveloperMode, devLogin);

module.exports = router;
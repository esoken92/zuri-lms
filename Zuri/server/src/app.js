const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import configuration
const config = require('./config/database');
const { pool } = require('./config/database');

// Import middleware
const { requireLogin, requireAdmin, requireRole, requireManagerOrAdmin } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const upload = require('./middleware/upload');

// Developer mode config
const { isDeveloperMode } = require('./config/developerMode');

// Import routes
const authRoutes = require('./routes/auth');
const inspectionRoutes = require('./routes/inspections');
const scrapRoutes = require('./routes/scrap');
const tyreRoutes = require('./routes/tyres');
const companyRoutes = require('./routes/companies');
const depotRoutes = require('./routes/depots');
const vehicleConfigRoutes = require('./routes/vehicleConfigs');
const draftRoutes = require('./routes/drafts');
const suggestionRoutes = require('./routes/suggestions');
const tableRoutes = require('./routes/table');

// Import utilities
const { logActivity } = require('./utils/activityLogger');
const { getClientIp, parseUserAgent } = require('./utils/clientInfo');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for IP detection
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/scraps', scrapRoutes);
app.use('/api/tyres', tyreRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/depots', depotRoutes);
app.use('/api/vehicle-configs', vehicleConfigRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/table', tableRoutes);

// Developer-mode status endpoint (used by client to enable dev UI)
app.get('/api/developer-mode', (req, res) => {
  return res.json({ isDeveloperMode });
});

// File upload route
app.post('/upload', requireLogin, upload.single('photo'), (req, res) => {
  const time = new Date().toISOString();
  if (!req.file) {
    const msg = `No file received`;
    console.warn(`[UPLOAD] ${time} - ${msg}`);
    logActivity(req, {
      activity_type: 'FILE_UPLOAD_ERROR',
      activity_description: msg,
      error_code: 'NO_FILE_PROVIDED',
      success: false
    });
    return res.status(400).json({ error: 'No file uploaded. Make sure the form field is named `photo`.' });
  }

  try {
    const msg = `Received file ${req.file.originalname} -> ${req.file.filename} (${req.file.size} bytes)`;
    console.log(`[UPLOAD] ${time} - ${msg}`);
    logActivity(req, {
      activity_type: 'FILE_UPLOADED',
      activity_description: msg,
      request_data: { filename: req.file.originalname, size: req.file.size, path: req.file.filename },
      success: true
    });
    return res.json({ path: `/uploads/${req.file.filename}` });
  } catch (err) {
    const msg = `Error saving file: ${err.message}`;
    console.error(`[UPLOAD] ${time} - ${msg}`);
    logActivity(req, {
      activity_type: 'FILE_UPLOAD_ERROR',
      activity_description: msg,
      error_code: 'FILE_SAVE_ERROR',
      success: false
    });
    return res.status(500).json({ error: 'Failed to save uploaded file', details: err.message });
  }
});

// Legacy routes for backward compatibility
app.post('/inspections', requireLogin, require('./controllers/legacy/inspectionController').createLegacyInspection);
app.post('/login', require('./controllers/authController').login);
app.post('/logout', require('./controllers/authController').logout);

// Simple session inspection endpoints (helps client fetch current user)
app.get('/me', (req, res) => {
  if (req.session && req.session.user) return res.json(req.session.user);
  return res.status(401).json({ error: 'Not authenticated' });
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.user) return res.json(req.session.user);
  return res.status(401).json({ error: 'Not authenticated' });
});

// Export data route
app.get('/export/:key', requireLogin, require('./controllers/tableController').exportTable);

// Stats route
app.get('/api/stats', requireLogin, require('./controllers/statsController').getStats);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database tables
const initializeDatabase = async () => {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Initialize database tables
    const { initializeTables } = require('./utils/databaseInit');
    await initializeTables();

    console.log('[INIT] Database tables initialized successfully');
  } catch (err) {
    console.error('[INIT] Error initializing database:', err);
    // Don't exit in test mode
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`[SERVER] ZURI LMS Server running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[SERVER] Failed to start server:', err);
    // Don't exit in test mode
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  pool.end(() => {
    console.log('[SERVER] Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received, shutting down gracefully');
  if (pool) {
    pool.end(() => {
      console.log('[SERVER] Database pool closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
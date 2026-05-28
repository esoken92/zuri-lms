require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('../src/routes/auth');
const inspectionRoutes = require('../src/routes/inspections');
const scrapRoutes = require('../src/routes/scrap');
const tyreRoutes = require('../src/routes/tyres');
const companyRoutes = require('../src/routes/companies');
const depotRoutes = require('../src/routes/depots');
const draftRoutes = require('../src/routes/drafts');
const suggestionRoutes = require('../src/routes/suggestions');
const tableRoutes = require('../src/routes/table');
const vehicleConfigRoutes = require('../src/routes/vehicleConfigs');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/scraps', scrapRoutes);
app.use('/api/tyres', tyreRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/depots', depotRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/table', tableRoutes);
app.use('/api/vehicle-configs', vehicleConfigRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;

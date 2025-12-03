// ZURI TIRE INSPECTION - FULL BACKEND (Auth, Stats, Utilities, Export, Role Security)
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Parser } = require('json2csv');
const crypto = require('crypto');
const resetPasswordRoute = require('./routes/resetPassword');
const resetConfirmRoute = require('./routes/resetConfirm');

const allowedOrigins = ['http://localhost:3000', 'http://localhost:5000'];

const app = express();
const PORT = 5000;

// Simple request logger (method, url, ip, timestamp)
// (Replaced by enhanced session-based logger above)


// PostgreSQL setup (read from env with sensible defaults)
const dbConfig = {
  user: process.env.PGUSER || process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'zuri',
  password: process.env.PGPASSWORD || '1234',
  port: Number(process.env.PGPORT) || 54321,
};
const pool = new Pool(dbConfig);

// Log DB config (without password) and check connectivity on startup
console.log(`[DB] Using Postgres config: user=${dbConfig.user} host=${dbConfig.host} port=${dbConfig.port} database=${dbConfig.database}`);
async function checkDb() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('[DB] Connected to Postgres, now=', res.rows[0].now);
    // Run migrations to ensure required tables exist
    await runMigrations();
  } catch (err) {
    console.error('[DB] Failed to connect to Postgres:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}
checkDb();

// Simple migration runner: ensure tables exist with appropriate schema
async function runMigrations() {
  try {
    console.log('[DB] Running migrations...');
    
    const createScrapsSql = `
      CREATE TABLE IF NOT EXISTS "scraps" (
        id SERIAL PRIMARY KEY,
        customer_name TEXT,
        customer_phone TEXT,
        customer_email TEXT,
        location TEXT,
        report_date TEXT,
        status TEXT,
        items JSONB,
        user_id INTEGER,
        user_name TEXT,
        store_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createScrapsSql);

    const createCompaniesSql = `
      CREATE TABLE IF NOT EXISTS "companies" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createCompaniesSql);

    const createDepotsSql = `
      CREATE TABLE IF NOT EXISTS "depots" (
        id SERIAL PRIMARY KEY,
        location TEXT NOT NULL,
        contact_name TEXT,
        email TEXT,
        phone TEXT,
        company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createDepotsSql);

    const createTyresSql = `
      CREATE TABLE IF NOT EXISTS "tyres" (
        id SERIAL PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        pattern VARCHAR(100) NOT NULL,
        "Ply Rating" VARCHAR(50),
        "Original Tread Depth" VARCHAR(50),
        "Load Rating" VARCHAR(50),
        "Load Rating Duals" VARCHAR(50),
        "Load Rating Singles" VARCHAR(50),
        "Speed Rating Duals" VARCHAR(10),
        "Speed Rating Singles" VARCHAR(10),
        "Tube Rating" VARCHAR(10),
        "Nominal Section Width" VARCHAR(50),
        "Aspect Ratio" VARCHAR(50),
        "Rim Size" VARCHAR(50),
        "Product Code" VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(brand, pattern, "Nominal Section Width", "Aspect Ratio", "Rim Size")
      );
    `;
    await pool.query(createTyresSql);

    const createVehicleConfigsSql = `
      CREATE TABLE IF NOT EXISTS "vehicle_configs" (
        id SERIAL PRIMARY KEY,
        item_code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        tire_config TEXT,
        tire_sizes JSONB,
        ideal_pressures JSONB,
        pressure_units JSONB,
        spares INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createVehicleConfigsSql);

    // User activity logging table
    const createActivityLogSql = `
      CREATE TABLE IF NOT EXISTS "user_activity_log" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT,
        activity_type TEXT NOT NULL,
        activity_description TEXT,
        table_name TEXT,
        record_id INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        browser TEXT,
        device TEXT,
        os TEXT,
        language TEXT,
        screen_resolution TEXT,
        timezone TEXT,
        success BOOLEAN DEFAULT true,
        error_code TEXT,
        error_message TEXT,
        request_data JSONB,
        response_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createActivityLogSql);

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_user_id ON user_activity_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_activity_created_at ON user_activity_log(created_at);
      CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(activity_type);
    `);

    // User sessions tracking table
    const createUserSessionsSql = `
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        username TEXT,
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        browser TEXT,
        browser_version TEXT,
        device TEXT,
        device_type TEXT,
        os TEXT,
        os_version TEXT,
        language TEXT,
        languages JSONB,
        screen_resolution TEXT,
        viewport_size TEXT,
        timezone TEXT,
        platform TEXT,
        cookie_enabled BOOLEAN,
        do_not_track BOOLEAN,
        login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        logout_time TIMESTAMP WITH TIME ZONE,
        session_duration INTEGER,
        is_active BOOLEAN DEFAULT true
      );
    `;
    await pool.query(createUserSessionsSql);

    // Create indexes for sessions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON user_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_sessions_login_time ON user_sessions(login_time);
    `);

    // User drafts table (auto-saved form data for offline persistence)
    const createUserDraftsSql = `
      CREATE TABLE IF NOT EXISTS "user_drafts" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        form_type TEXT NOT NULL,
        form_name TEXT NOT NULL,
        draft_data JSONB,
        sync_status TEXT DEFAULT 'pending',
        last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createUserDraftsSql);

    // Create indexes for drafts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON user_drafts(user_id);
      CREATE INDEX IF NOT EXISTS idx_drafts_form_type ON user_drafts(form_type);
      CREATE INDEX IF NOT EXISTS idx_drafts_last_saved ON user_drafts(last_saved);
    `);

    // Add columns to tyres table for triple depth readings if they don't exist
    try {
      await pool.query(`ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "depthInner" NUMERIC(5,2);`);
      await pool.query(`ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "depthMiddle" NUMERIC(5,2);`);
      await pool.query(`ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "depthOuter" NUMERIC(5,2);`);
      await pool.query(`ALTER TABLE "tyres" ADD COLUMN IF NOT EXISTS "comments" TEXT;`);
    } catch (alterErr) {
      // Column might already exist, which is fine
      console.log('[DB] Tire columns update (expected if already exist):', alterErr.message);
    }

    // Create inspections_drafts table for auto-save functionality
    const createInspectionsDraftsSql = `
      CREATE TABLE IF NOT EXISTS "inspections_drafts" (
        id SERIAL PRIMARY KEY,
        draft_id TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        header JSONB NOT NULL,
        vehicles JSONB NOT NULL,
        last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createInspectionsDraftsSql);

    // Create indexes for drafts
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_inspections_drafts_draft_id ON inspections_drafts(draft_id);
      CREATE INDEX IF NOT EXISTS idx_inspections_drafts_user_id ON inspections_drafts(user_id);
      CREATE INDEX IF NOT EXISTS idx_inspections_drafts_last_saved ON inspections_drafts(last_saved);
    `);

    // Create vehicle_configurations table if it doesn't exist
    const createVehicleConfigurationsSql = `
      CREATE TABLE IF NOT EXISTS "vehicle_configurations" (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        positionName TEXT NOT NULL,
        tireCount INTEGER DEFAULT 4,
        status TEXT DEFAULT 'approved',
        suggestedBy TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await pool.query(createVehicleConfigurationsSql);

    // Create configuration_suggestions table for user suggestions
    const createConfigSuggestionsSql = `
      CREATE TABLE IF NOT EXISTS "configuration_suggestions" (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        positionName TEXT NOT NULL,
        tireCount INTEGER DEFAULT 4,
        suggestedBy TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        approved_at TIMESTAMP WITH TIME ZONE
      );
    `;
    await pool.query(createConfigSuggestionsSql);

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_configs_code ON vehicle_configurations(code);
      CREATE INDEX IF NOT EXISTS idx_config_suggestions_status ON configuration_suggestions(status);
    `);

    // Create scrap_data table
    const createScrapDataSql = `
      CREATE TABLE IF NOT EXISTS "scrap_data" (
        id SERIAL PRIMARY KEY,
        location VARCHAR(100) NOT NULL,
        damage_code VARCHAR(50) NOT NULL,
        damage_description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(location, damage_code)
      )
    `;
    await pool.query(createScrapDataSql);

    // Create index on scrap_data
    await pool.query('CREATE INDEX IF NOT EXISTS idx_scrap_data_location ON scrap_data(location)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_scrap_data_code ON scrap_data(damage_code)');

    // Seed scrap_data table if empty
    const checkScrapData = await pool.query('SELECT COUNT(*) as count FROM scrap_data');
    console.log('[DB] Scrap data count:', checkScrapData.rows[0].count);
    if (checkScrapData.rows[0].count == 0 || checkScrapData.rows[0].count === '0') {
      console.log('[DB] Seeding scrap_data table...');
      const scrapDataRecords = [
        // TREAD
        { location: 'TREAD', code: 'TR-1', description: 'Puncture/Cut (To Interior)' },
        { location: 'TREAD', code: 'TR-2', description: 'Puncture/Cut (Not To Interior)' },
        { location: 'TREAD', code: 'TR-3', description: 'Chipping/Chunking' },
        { location: 'TREAD', code: 'TR-4', description: 'Cut Separation' },
        { location: 'TREAD', code: 'TR-5', description: 'Impact Break' },
        { location: 'TREAD', code: 'TR-6', description: 'Stone Retention Damage' },
        { location: 'TREAD', code: 'TR-7', description: 'Brake Lock/Chipping' },
        { location: 'TREAD', code: 'TR-8', description: 'Irregular Wear' },
        { location: 'TREAD', code: 'TR-9', description: 'Worn Too Far' },
        { location: 'TREAD', code: 'TR-10', description: 'Defense Groove Tearing' },
        { location: 'TREAD', code: 'TR-11', description: 'Rib/Lug Tearing' },
        { location: 'TREAD', code: 'TR-12', description: 'Groove Cracking' },
        { location: 'TREAD', code: 'TR-13', description: 'Open Splice' },
        { location: 'TREAD', code: 'TR-14', description: 'Tread Leaving Belt' },
        { location: 'TREAD', code: 'TR-15', description: 'Belt Leaving Belt' },
        { location: 'TREAD', code: 'TR-16', description: 'Belt Leaving Casing' },
        { location: 'TREAD', code: 'TR-17', description: 'Other (Explain In Comments)' },
        // SHOULDER
        { location: 'SHOULDER', code: 'SH-1', description: 'Puncture/Cut (To Interior)' },
        { location: 'SHOULDER', code: 'SH-2', description: 'Puncture/Cut (Not To Interior)' },
        { location: 'SHOULDER', code: 'SH-3', description: 'Diagonal Cracking' },
        { location: 'SHOULDER', code: 'SH-4', description: 'Circumferential Crack' },
        { location: 'SHOULDER', code: 'SH-5', description: 'Ozone Cracking' },
        { location: 'SHOULDER', code: 'SH-6', description: 'Radial Split' },
        { location: 'SHOULDER', code: 'SH-7', description: 'Migrating Wire' },
        { location: 'SHOULDER', code: 'SH-8', description: 'Abuse/Heat Separation' },
        { location: 'SHOULDER', code: 'SH-9', description: 'Separation' },
        { location: 'SHOULDER', code: 'SH-10', description: 'Belt Edge Separation' },
        { location: 'SHOULDER', code: 'SH-11', description: 'Other (Explain In Comments)' },
        // SIDEWALL
        { location: 'SIDEWALL', code: 'SW-1', description: 'Puncture/Cut (To Interior)' },
        { location: 'SIDEWALL', code: 'SW-2', description: 'Puncture/Cut (Not To Interior)' },
        { location: 'SIDEWALL', code: 'SW-3', description: 'Impact Break' },
        { location: 'SIDEWALL', code: 'SW-4', description: 'Curbing Damage' },
        { location: 'SIDEWALL', code: 'SW-5', description: 'Runflat Damage' },
        { location: 'SIDEWALL', code: 'SW-6', description: 'Diagonal Cracking' },
        { location: 'SIDEWALL', code: 'SW-7', description: 'Circumferential Cracking' },
        { location: 'SIDEWALL', code: 'SW-8', description: 'Ozone Cracking' },
        { location: 'SIDEWALL', code: 'SW-9', description: 'Cord Fatigue/CSU' },
        { location: 'SIDEWALL', code: 'SW-10', description: 'Open Splice' },
        { location: 'SIDEWALL', code: 'SW-11', description: 'Distorted Ply Cords' },
        { location: 'SIDEWALL', code: 'SW-12', description: 'Bulge/Blister' },
        { location: 'SIDEWALL', code: 'SW-13', description: 'Separation' },
        { location: 'SIDEWALL', code: 'SW-14', description: 'Cut Separation' },
        { location: 'SIDEWALL', code: 'SW-15', description: 'Other (Explain In Comments)' },
        // BEAD
        { location: 'BEAD', code: 'BD-1', description: 'Cut' },
        { location: 'BEAD', code: 'BD-2', description: 'Mount/Dismount Damage' },
        { location: 'BEAD', code: 'BD-3', description: 'Bent Bead' },
        { location: 'BEAD', code: 'BD-4', description: 'Burned Bead' },
        { location: 'BEAD', code: 'BD-5', description: 'Ozone Cracking' },
        { location: 'BEAD', code: 'BD-6', description: 'Bead Crease' },
        { location: 'BEAD', code: 'BD-7', description: 'Chafer Edge Separation' },
        { location: 'BEAD', code: 'BD-8', description: 'Impact Chafer Edge Sep.' },
        { location: 'BEAD', code: 'BD-9', description: 'Chafer Separation' },
        { location: 'BEAD', code: 'BD-10', description: 'Ply Turn-Up Separation' },
        { location: 'BEAD', code: 'BD-11', description: 'Bead Burst' },
        { location: 'BEAD', code: 'BD-12', description: 'Other (Explain In Comments)' },
        // INTERIOR
        { location: 'INTERIOR', code: 'IN-1', description: 'Cut' },
        { location: 'INTERIOR', code: 'IN-2', description: 'Cracks' },
        { location: 'INTERIOR', code: 'IN-3', description: 'Blister/Bubble' },
        { location: 'INTERIOR', code: 'IN-4', description: 'Open Splice' },
        { location: 'INTERIOR', code: 'IN-5', description: 'Damaged (Foreign Object)' },
        { location: 'INTERIOR', code: 'IN-6', description: 'Chafer Edge Separation' },
        { location: 'INTERIOR', code: 'IN-7', description: 'Separation (From Innerliner)' },
        { location: 'INTERIOR', code: 'IN-8', description: 'Separation (From Casing)' },
        { location: 'INTERIOR', code: 'IN-9', description: 'Other (Explain In Comments)' },
        // GENERAL
        { location: 'GENERAL', code: 'GN-1', description: 'Improper Repair' },
        { location: 'GENERAL', code: 'GN-2', description: 'Failure At Repair' },
        { location: 'GENERAL', code: 'GN-3', description: 'Repairs Too Close' },
        { location: 'GENERAL', code: 'GN-4', description: 'Missed Strive/Nail Hole (Retread)' },
        { location: 'GENERAL', code: 'GN-5', description: 'Bond Line Failure (Retread)' },
        { location: 'GENERAL', code: 'GN-6', description: 'Improper Buff' },
        { location: 'GENERAL', code: 'GN-7', description: 'Branding Damage' },
        { location: 'GENERAL', code: 'GN-8', description: 'Petroleum/Chemical Damage' },
        { location: 'GENERAL', code: 'GN-9', description: 'Vehicle Damage' },
        { location: 'GENERAL', code: 'GN-10', description: 'Dynamometer Damage' },
        { location: 'GENERAL', code: 'GN-11', description: 'Foreign Material' },
        { location: 'GENERAL', code: 'GN-12', description: 'Unknown' },
        { location: 'GENERAL', code: 'GN-13', description: 'Customer Spec Not Met (Too Old)' },
        { location: 'GENERAL', code: 'GN-14', description: 'Customer Spec Not Met (Too Many Repairs)' },
        { location: 'GENERAL', code: 'GN-15', description: 'Customer Spec Not Met (Other)' },
      ];

      for (const damage of scrapDataRecords) {
        await pool.query(
          'INSERT INTO scrap_data (location, damage_code, damage_description) VALUES ($1, $2, $3)',
          [damage.location, damage.code, damage.description]
        );
      }
      console.log(`[DB] Seeded ${scrapDataRecords.length} scrap data records`);
    }

    // Seed tyres table if empty
    const checkTyres = await pool.query('SELECT COUNT(*) as count FROM tyres');
    console.log('[DB] Tyres count:', checkTyres.rows[0].count);
    if (checkTyres.rows[0].count == 0 || checkTyres.rows[0].count === '0') {
      console.log('[DB] Seeding tyres table...');
      const tyresRecords = [
        { brand: 'Michelin', pattern: 'X Multi HDD', 'Ply Rating': '18PR', 'Original Tread Depth': '22.5', 'Load Rating': '156/150', 'Load Rating Duals': '156', 'Load Rating Singles': '150', 'Speed Rating Duals': 'K', 'Speed Rating Singles': 'L', 'Tube Rating': 'TL', 'Nominal Section Width': '315', 'Aspect Ratio': '65', 'Rim Size': '22.5' },
        { brand: 'Bridgestone', pattern: 'M840', 'Ply Rating': '16PR', 'Original Tread Depth': '16.5', 'Load Rating': '150/145', 'Load Rating Duals': '150', 'Load Rating Singles': '145', 'Speed Rating Duals': 'J', 'Speed Rating Singles': 'K', 'Tube Rating': 'TL', 'Nominal Section Width': '295', 'Aspect Ratio': '80', 'Rim Size': '22.5' },
        { brand: 'Continental', pattern: 'HS3', 'Ply Rating': '20PR', 'Original Tread Depth': '15.5', 'Load Rating': '160/150', 'Load Rating Duals': '160', 'Load Rating Singles': '150', 'Speed Rating Duals': 'L', 'Speed Rating Singles': 'M', 'Tube Rating': 'TL', 'Nominal Section Width': '315', 'Aspect Ratio': '70', 'Rim Size': '22.5' },
        { brand: 'Sumitomo', pattern: 'ST909', 'Ply Rating': '18PR', 'Original Tread Depth': '17', 'Load Rating': '154/150', 'Load Rating Duals': '154', 'Load Rating Singles': '150', 'Speed Rating Duals': 'K', 'Speed Rating Singles': 'L', 'Tube Rating': 'TL', 'Nominal Section Width': '315', 'Aspect Ratio': '80', 'Rim Size': '22.5' },
        { brand: 'Goodyear', pattern: 'KMAX S', 'Ply Rating': '16PR', 'Original Tread Depth': '17', 'Load Rating': '148/145', 'Load Rating Duals': '148', 'Load Rating Singles': '145', 'Speed Rating Duals': 'J', 'Speed Rating Singles': 'K', 'Tube Rating': 'TL', 'Nominal Section Width': '295', 'Aspect Ratio': '75', 'Rim Size': '22.5' }
      ];

      for (const tyre of tyresRecords) {
        await pool.query(
          'INSERT INTO tyres (brand, pattern, "Ply Rating", "Original Tread Depth", "Load Rating", "Load Rating Duals", "Load Rating Singles", "Speed Rating Duals", "Speed Rating Singles", "Tube Rating", "Nominal Section Width", "Aspect Ratio", "Rim Size") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
          [tyre.brand, tyre.pattern, tyre['Ply Rating'], tyre['Original Tread Depth'], tyre['Load Rating'], tyre['Load Rating Duals'], tyre['Load Rating Singles'], tyre['Speed Rating Duals'], tyre['Speed Rating Singles'], tyre['Tube Rating'], tyre['Nominal Section Width'], tyre['Aspect Ratio'], tyre['Rim Size']]
        );
      }
      console.log(`[DB] Seeded ${tyresRecords.length} tyre records`);
    }
  } catch (err) {
    console.error('[DB] Migration failed:', err.message);
    console.error(err.stack);
    throw err;
  }
}

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('[LOG] Created logs directory:', logsDir);
}

// User-based file logger (persists logs by username)
const getUserLogDir = (username) => {
  const sanitized = (username || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(logsDir, sanitized);
};

const ensureUserLogDir = (username) => {
  const userDir = getUserLogDir(username);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
};

const getUserLogFile = (username) => {
  const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const userDir = ensureUserLogDir(username);
  const filename = `activity_${dateStr}.log`;
  return path.join(userDir, filename);
};

const logToFile = (username, message) => {
  if (!username) return; // Skip if no user
  try {
    const logFile = getUserLogFile(username);
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (err) {
    console.error(`[LOG] Failed to write user log for ${username}:`, err.message);
  }
};

// Helper to parse user agent
const parseUserAgent = (userAgent) => {
  if (!userAgent) return {};
  
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown', os = 'Unknown', device = 'Desktop';
  
  // Browser detection
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/')) browser = 'Chrome';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('opr/') || ua.includes('opera/')) browser = 'Opera';
  
  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  // Device detection
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  
  return { browser, os, device };
};

// Activity logging to database - SECURE (sanitizes sensitive data)
const sanitizeForLogging = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const safe = JSON.parse(JSON.stringify(obj));
  const sensitiveFields = ['password', 'token', 'clientInfo', 'authToken', 'refreshToken', 'secret', 'api_key'];
  const traverse = (val) => {
    if (val && typeof val === 'object') {
      Object.keys(val).forEach(k => {
        if (sensitiveFields.some(s => k.toLowerCase().includes(s.toLowerCase()))) {
          val[k] = '[REDACTED]';
        } else {
          traverse(val[k]);
        }
      });
    }
  };
  traverse(safe);
  return safe;
};

const logActivity = async (activityData) => {
  try {
    const {
      userId,
      username,
      activityType,
      activityDescription,
      tableName,
      recordId,
      ipAddress,
      userAgent,
      success = true,
      errorCode,
      errorMessage,
      requestData,
      responseData,
      clientInfo = {}
    } = activityData;

    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Sanitize request/response to avoid logging sensitive data
    const sanitizedRequest = requestData ? sanitizeForLogging(requestData) : null;
    const sanitizedResponse = responseData ? sanitizeForLogging(responseData) : null;

    await pool.query(`
      INSERT INTO user_activity_log (
        user_id, username, activity_type, activity_description, table_name, record_id,
        ip_address, user_agent, browser, device, os, language, screen_resolution, timezone,
        success, error_code, error_message, request_data, response_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
    `, [
      userId, username, activityType, activityDescription, tableName, recordId,
      ipAddress, userAgent, browser, device, os,
      clientInfo.language, clientInfo.screenResolution, clientInfo.timezone,
      success, errorCode, errorMessage,
      sanitizedRequest ? JSON.stringify(sanitizedRequest) : null,
      sanitizedResponse ? JSON.stringify(sanitizedResponse) : null
    ]);

    // Also log to file (with sanitized data)
    const status = success ? 'SUCCESS' : 'FAILED';
    const errorInfo = errorCode ? ` [${errorCode}] ${errorMessage}` : '';
    logToFile(username, `${activityType}: ${activityDescription} - ${status}${errorInfo}`);
  } catch (err) {
    console.error('[LOG] Failed to log activity to database:', err.message);
  }
};

// Helper to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
};

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow non-browser tools like Postman
    const cleanedOrigin = origin.trim().toLowerCase();
    if (allowedOrigins.includes(cleanedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Generate secure session secret from env or crypto
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('[SEC] WARNING: SESSION_SECRET not set in environment. Using random value (will reset on restart).');
  console.warn('[SEC] For production, set SESSION_SECRET environment variable.');
}

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: 1000 * 60 * 60 * 24
  }
}));

// Attach username to request for logging (from session if authenticated)
app.use((req, res, next) => {
  req.logUsername = req.session?.user?.username || 'anonymous';
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Enhanced request logger: console + file (per user)
app.use((req, res, next) => {
  const time = new Date().toISOString();
  const bodySize = req.body && Object.keys(req.body).length ? Object.keys(req.body).length : 0;
  const logMsg = `${req.method} ${req.originalUrl} from ${req.ip} bodyKeys=${bodySize}`;
  
  console.log(`[REQ] ${time} - ${logMsg}`);
  logToFile(req.logUsername, `[REQ] ${req.method} ${req.originalUrl} from ${req.ip} bodyKeys=${bodySize}`);
  
  // Capture response status and log on end
  const originalSend = res.send;
  res.send = function(data) {
    logToFile(req.logUsername, `[RES] ${req.method} ${req.originalUrl} status=${res.statusCode}`);
    return originalSend.call(this, data);
  };
  
  next();
});
app.use('/api/reset-password', resetPasswordRoute);
app.use('/api/reset-password/confirm', resetConfirmRoute);

// Multer storage config for photo uploads - SECURE
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }
});

// File filter: only allow images (including HEIF/HEIC from iPhone/Android)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heif', 'image/heic'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heif', '.heic'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`INVALID_FILE_TYPE|${file.mimetype}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// Error handler for multer file size and type errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const errorCode = `FILE_TOO_LARGE_${Date.now()}`;
      const fileSizeMsg = `File exceeds 10MB limit`;
      console.warn(`[UPLOAD] ${new Date().toISOString()} - ${errorCode}: ${fileSizeMsg}`);
      logToFile(req.logUsername, `[UPLOAD] ${errorCode}: ${fileSizeMsg}`);
      
      // Log to activity log with error code
      logActivity(req, {
        activity_type: 'FILE_UPLOAD_ERROR',
        activity_description: fileSizeMsg,
        error_code: errorCode,
        request_data: { filename: req.file?.originalname || 'unknown', size: req.file?.size || 0 },
        success: false
      });
      
      return res.status(413).json({ 
        error: 'File too large',
        errorCode,
        message: fileSizeMsg,
        maxSize: '10MB'
      });
    }
  } else if (err && err.message && err.message.includes('INVALID_FILE_TYPE')) {
    const errorCode = `INVALID_FILE_TYPE_${Date.now()}`;
    const mimeType = err.message.split('|')[1] || 'unknown';
    const msg = `Invalid file type: ${mimeType}. Only JPEG, PNG, GIF, WebP, HEIF/HEIC allowed`;
    console.warn(`[UPLOAD] ${new Date().toISOString()} - ${errorCode}: ${msg}`);
    logToFile(req.logUsername, `[UPLOAD] ${errorCode}: ${msg}`);
    
    logActivity(req, {
      activity_type: 'FILE_UPLOAD_ERROR',
      activity_description: msg,
      error_code: errorCode,
      request_data: { filename: req.file?.originalname || 'unknown', mimeType },
      success: false
    });
    
    return res.status(400).json({ 
      error: 'Invalid file type',
      errorCode,
      message: msg
    });
  }
  next(err);
};

// Normalize keys: convert camelCase to snake_case, remove unsafe chars, lowercase
const normalize = (s) => {
  if (!s || typeof s !== 'string') return '';
  // Insert underscore between lower->Upper (camelCase to snake_case)
  let out = s.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  // Replace non-alphanumerics with underscores
  out = out.replace(/[^a-zA-Z0-9_]/g, '_');
  // Collapse multiple underscores and trim
  out = out.replace(/__+/g, '_').replace(/^_|_$/g, '');
  return out.toLowerCase();
};

// POST /upload - accepts multipart/form-data field `photo` (SECURE)
app.post('/upload', requireLogin, upload.single('photo'), handleUploadErrors, (req, res) => {
  const time = new Date().toISOString();
  if (!req.file) {
    const msg = `No file received`;
    console.warn(`[UPLOAD] ${time} - ${msg}`);
    logToFile(req.logUsername, `[UPLOAD] ${msg}`);
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
    logToFile(req.logUsername, `[UPLOAD] ${msg}`);
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
    logToFile(req.logUsername, `[UPLOAD] ${msg}`);
    logActivity(req, {
      activity_type: 'FILE_UPLOAD_ERROR',
      activity_description: msg,
      error_code: 'FILE_SAVE_ERROR',
      success: false
    });
    return res.status(500).json({ error: 'Failed to save uploaded file', details: err.message });
  }
});

// POST /inspections - accept inspection data and save to Postgres (creates table if missing)
app.post('/inspections', requireLogin, async (req, res) => {
  const time = new Date().toISOString();
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      const msg = `Empty payload`;
      console.warn(`[INSPECT] ${time} - ${msg}`);
      logToFile(req.logUsername, `[INSPECT] ${msg}`);
      return res.status(400).json({ error: 'No inspection data provided' });
    }

    const msg = `Saving inspection for vehicleId=${data.vehicleId || 'N/A'}`;
    console.log(`[INSPECT] ${time} - ${msg}`);
    logToFile(req.logUsername, `[INSPECT] ${msg}`);
    await ensureTable('inspections', data);

    const cols = Object.keys(data);
    const values = Object.values(data);
    const normalizedCols = cols.map(c => normalize(c));
    const placeholders = cols.map((_, i) => `$${i + 1}`);

    const insertSql = `INSERT INTO "inspections" (${normalizedCols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
    try {
      await pool.query(insertSql, values);
    } catch (sqlErr) {
      console.error(`[DB] Insert failed. SQL=${insertSql} values=${JSON.stringify(values)} err=${sqlErr.message}`);
      logToFile(req.logUsername, `[DB] Insert failed: ${sqlErr.message}`);
      console.error(sqlErr.stack);
      throw sqlErr;
    }

    const successMsg = `Inspection saved successfully`;
    console.log(`[INSPECT] ${time} - ${successMsg}`);
    logToFile(req.logUsername, `[INSPECT] ${successMsg}`);
    res.status(200).json({ message: 'Inspection saved' });
  } catch (err) {
    const errMsg = `Save inspection failed: ${err.message}`;
    console.error(`[INSPECT] ${time} - ${errMsg}`);
    logToFile(req.logUsername, `[INSPECT] ${errMsg}`);
    res.status(500).json({ error: 'Failed to save inspection', details: err.message });
  }
});

// ===== NEW MULTI-VEHICLE INSPECTION API =====

// POST /api/inspections - NEW multi-vehicle inspection submission
app.post('/api/inspections', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { header, vehicles, timestamp } = req.body;

    // Validate required fields
    if (!header || !vehicles || !Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({ error: 'Invalid inspection data: header and vehicles array required' });
    }

    if (!header.companyId || !header.depotId || !header.date || !header.location) {
      return res.status(400).json({ error: 'Missing required header fields: companyId, depotId, date, location' });
    }

    // Insert into inspections table (dynamic schema)
    const inspectionData = {
      user_id: user.id,
      user_name: user.username,
      company_id: header.companyId,
      depot_id: header.depotId,
      inspection_date: header.date,
      location: header.location,
      header: JSON.stringify(header),
      vehicles: JSON.stringify(vehicles),
      timestamp,
      created_at: new Date().toISOString(),
    };

    const cols = Object.keys(inspectionData);
    const values = Object.values(inspectionData);
    const placeholders = cols.map((_, i) => `$${i + 1}`);
    const insertSql = `INSERT INTO "inspections" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`;

    const result = await pool.query(insertSql, values);
    const inspectionId = result.rows[0].id;

    // Log activity
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'INSPECTION_SUBMITTED',
      activityDescription: `Submitted multi-vehicle inspection with ${vehicles.length} vehicle(s)`,
      tableName: 'inspections',
      recordId: inspectionId,
      ipAddress,
      userAgent,
      requestData: { vehicleCount: vehicles.length, location: header.location },
      success: true
    });

    res.status(201).json({ 
      message: 'Inspection submitted successfully',
      inspectionId,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[INSPECT] POST /api/inspections failed:', err.message);
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'INSPECTION_SUBMIT_ERROR',
      activityDescription: `Failed to submit inspection: ${err.message}`,
      tableName: 'inspections',
      ipAddress,
      userAgent,
      errorCode: 'INSPECT_SUBMIT_FAILED',
      errorMessage: err.message,
      success: false
    });
    res.status(500).json({ error: 'Failed to submit inspection', details: err.message });
  }
});

// GET /api/inspections - List all inspections for authenticated user (filtered by role)
app.get('/api/inspections', requireLogin, async (req, res) => {
  try {
    let query = 'SELECT * FROM inspections WHERE 1=1';
    const params = [];

    // Filter by user role
    if (req.session.user.role !== 'Administrator' && req.session.user.role !== 'Group Manager') {
      query += ' AND user_id = $1';
      params.push(req.session.user.id);
    }

    query += ' ORDER BY created_at DESC LIMIT 500';
    const result = await pool.query(query, params);
    
    // Parse JSON fields
    const inspections = result.rows.map(row => ({
      ...row,
      header: typeof row.header === 'string' ? JSON.parse(row.header) : row.header,
      vehicles: typeof row.vehicles === 'string' ? JSON.parse(row.vehicles) : row.vehicles,
    }));

    res.json(inspections);
  } catch (err) {
    console.error('[INSPECT] GET /api/inspections failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch inspections', details: err.message });
  }
});

// GET /api/inspections/:id - Get specific inspection
app.get('/api/inspections/:id', requireLogin, async (req, res) => {
  try {
    let query = 'SELECT * FROM inspections WHERE id = $1';
    const params = [req.params.id];

    // Add user filter if not admin
    if (req.session.user.role !== 'Administrator' && req.session.user.role !== 'Group Manager') {
      query += ' AND user_id = $2';
      params.push(req.session.user.id);
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    const row = result.rows[0];
    const inspection = {
      ...row,
      header: typeof row.header === 'string' ? JSON.parse(row.header) : row.header,
      vehicles: typeof row.vehicles === 'string' ? JSON.parse(row.vehicles) : row.vehicles,
    };

    res.json(inspection);
  } catch (err) {
    console.error('[INSPECT] GET /api/inspections/:id failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch inspection', details: err.message });
  }
});

// POST /api/drafts/inspection - Create new inspection draft
app.post('/api/drafts/inspection', requireLogin, async (req, res) => {
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
});

// GET /api/drafts/inspection/:draftId - Retrieve inspection draft
app.get('/api/drafts/inspection/:draftId', requireLogin, async (req, res) => {
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
});

// DELETE /api/drafts/inspection/:draftId - Delete inspection draft
app.delete('/api/drafts/inspection/:draftId', requireLogin, async (req, res) => {
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
});

// GET /api/table/vehicle-configurations - Get vehicle configurations
app.get('/api/table/vehicle-configurations', requireLogin, async (req, res) => {
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
});

// Centralized error handler (returns JSON)
app.use((err, req, res, next) => {
  const time = new Date().toISOString();
  const logMsg = `[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`;
  console.error(`${logMsg}`);
  logToFile(req.logUsername, logMsg);
  console.error(err.stack);
  logToFile(req.logUsername, err.stack);
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };
  if (process.env.NODE_ENV === 'development') payload.stack = err.stack;
  res.status(status).json(payload);
});

// Auth Middleware
function requireLogin(req, res, next) {
  console.log('[AUTH] requireLogin check - session:', !!req.session, 'user:', !!req.session?.user, 'path:', req.path);
  if (!req.session.user) {
    console.log('[AUTH] requireLogin DENIED - not logged in');
    return res.status(401).json({ error: 'Not logged in' });
  }
  console.log('[AUTH] requireLogin OK - user:', req.session.user.email);
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'Administrator') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}

function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
}

function requireManagerOrAdmin(req, res, next) {
  if (!req.session.user || (req.session.user.role !== 'Administrator' && req.session.user.role !== 'Group Manager')) {
    return res.status(403).json({ error: 'Manager or admin access required' });
  }
  next();
}

// Auth Routes
app.post('/login', async (req, res) => {
  const { username, password, clientInfo } = req.body;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      // Log failed login attempt
      await logActivity({
        userId: null,
        username: username,
        activityType: 'LOGIN_FAILED',
        activityDescription: `Failed login attempt for username: ${username}`,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: false,
        errorCode: 'AUTH_001',
        errorMessage: 'Invalid credentials',
        clientInfo: clientInfo || {}
      });
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.user = { id: user.id, username: user.username, role: user.role };
    
    // Parse user agent
    const { browser, os, device } = parseUserAgent(userAgent);
    
    // Create session record with detailed client info
    const sessionResult = await pool.query(`
      INSERT INTO user_sessions (
        user_id, username, session_id, ip_address, user_agent,
        browser, browser_version, device, device_type, os, os_version,
        language, languages, screen_resolution, viewport_size, timezone,
        platform, cookie_enabled, do_not_track
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `, [
      user.id,
      user.username,
      req.sessionID,
      ipAddress,
      userAgent,
      browser,
      clientInfo?.browserVersion || null,
      device,
      clientInfo?.deviceType || null,
      os,
      clientInfo?.osVersion || null,
      clientInfo?.language || null,
      clientInfo?.languages ? JSON.stringify(clientInfo.languages) : null,
      clientInfo?.screenResolution || null,
      clientInfo?.viewportSize || null,
      clientInfo?.timezone || null,
      clientInfo?.platform || null,
      clientInfo?.cookieEnabled || null,
      clientInfo?.doNotTrack || null
    ]);
    
    // Log successful login
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'LOGIN_SUCCESS',
      activityDescription: `User logged in successfully`,
      ipAddress: ipAddress,
      userAgent: userAgent,
      success: true,
      clientInfo: clientInfo || {},
      responseData: { sessionId: sessionResult.rows[0].id }
    });
    
    res.json({ message: 'Logged in', user: req.session.user });
  } catch (err) {
    // Log system error
    await logActivity({
      userId: null,
      username: username,
      activityType: 'LOGIN_ERROR',
      activityDescription: `System error during login`,
      ipAddress: ipAddress,
      userAgent: userAgent,
      success: false,
      errorCode: 'SYS_001',
      errorMessage: err.message,
      clientInfo: clientInfo || {}
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.post('/logout', async (req, res) => {
  const user = req.session?.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  if (user) {
    try {
      // Update session record with logout time
      await pool.query(`
        UPDATE user_sessions
        SET logout_time = NOW(),
            session_duration = EXTRACT(EPOCH FROM (NOW() - login_time))::INTEGER,
            is_active = false
        WHERE session_id = $1 AND user_id = $2 AND is_active = true
      `, [req.sessionID, user.id]);
      
      // Log logout
      await logActivity({
        userId: user.id,
        username: user.username,
        activityType: 'LOGOUT',
        activityDescription: `User logged out`,
        ipAddress: ipAddress,
        userAgent: userAgent,
        success: true
      });
    } catch (err) {
      console.error('[LOGOUT] Error updating session:', err.message);
    }
  }
  
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

// Table utilities
async function ensureTable(key, sampleRow) {
  const keys = Object.keys(sampleRow);
  const normalizedCols = keys.map(k => normalize(k));

  // Ensure table exists (create with only id if missing)
  const createQuery = `CREATE TABLE IF NOT EXISTS "${key}" (id SERIAL PRIMARY KEY)`;
  try {
    await pool.query(createQuery);
  } catch (err) {
    console.error(`[DB] ensureTable (create) failed for ${key}: ${err.message}`);
    console.error(err.stack);
    throw err;
  }

  // Add any missing columns (as TEXT) using normalized column names
  try {
    const colRes = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [key]
    );
    const existing = colRes.rows.map(r => r.column_name);
    for (const col of normalizedCols) {
      if (existing.includes(col)) continue;
      const alterSql = `ALTER TABLE "${key}" ADD COLUMN "${col}" TEXT`;
      console.log(`[DB] Adding missing column ${col} to ${key}`);
      await pool.query(alterSql);
    }
  } catch (err) {
    console.error(`[DB] ensureTable (alter) failed for ${key}: ${err.message}`);
    console.error(err.stack);
    throw err;
  }
}

// Whitelist of allowed tables for dynamic access (security: prevent access to system tables)
const ALLOWED_DYNAMIC_TABLES = ['scraps', 'inspections', 'companies', 'depots', 'vehicle_configs', 'tyres', 'vehicles'];

const validateTableAccess = (key) => {
  if (!ALLOWED_DYNAMIC_TABLES.includes(key)) {
    throw new Error(`Access denied to table: ${key}. Not in whitelist.`);
  }
};

// ============================================================================
// SCRAP DATA ENDPOINTS (Must be BEFORE generic /api/table/:key routes)
// ============================================================================

// GET /api/table/scrap-data - Get all scrap data
app.get('/api/table/scrap-data', async (req, res) => {
  try {
    // Note: Temporarily allowing unauthenticated access for testing/development
    // In production, add requireLogin back here
    console.log('[SCRAP_DATA] GET request - user:', req.session?.user?.username || 'anonymous');
    const result = await pool.query('SELECT id, location, damage_code, damage_description FROM scrap_data ORDER BY location, damage_code');
    console.log('[SCRAP_DATA] GET - returning', result.rows.length, 'records');
    res.json(result.rows);
  } catch (err) {
    console.error('[SCRAP_DATA] GET failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch scrap damages' });
  }
});

// GET /api/table/scrap-data/:location - Get data by location
app.get('/api/table/scrap-data/:location', requireLogin, async (req, res) => {
  try {
    const location = req.params.location.toUpperCase();
    const result = await pool.query(
      'SELECT id, location, damage_code, damage_description FROM scrap_data WHERE location = $1 ORDER BY damage_code',
      [location]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[SCRAP_DATA] GET by location failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch scrap damages' });
  }
});

// POST /api/table/scrap-data - Create new scrap data (Admin only)
app.post('/api/table/scrap-data', requireLogin, requireRole('Administrator'), async (req, res) => {
  try {
    console.log('[SCRAP_DATA] POST received, body:', req.body);
    const { location, damage_code, damage_description } = req.body;
    
    console.log('[SCRAP_DATA] Parsed values - location:', location, 'code:', damage_code, 'desc:', damage_description);
    
    if (!location || !damage_code || !damage_description) {
      console.log('[SCRAP_DATA] Missing fields - location:', !!location, 'code:', !!damage_code, 'desc:', !!damage_description);
      return res.status(400).json({ error: 'Location, damage_code, and damage_description are required' });
    }

    const result = await pool.query(
      'INSERT INTO scrap_data (location, damage_code, damage_description) VALUES ($1, $2, $3) RETURNING *',
      [location.toUpperCase(), damage_code.toUpperCase(), damage_description]
    );

    console.log('[SCRAP_DATA] POST successful, created:', result.rows[0]);
    logActivity(req.session.user.id, req.session.user.username, 'CREATE_SCRAP_DAMAGE', `Added damage code ${damage_code}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.constraint === 'scrap_data_location_damage_code_key') {
      return res.status(409).json({ error: 'This location/damage_code combination already exists' });
    }
    console.error('[SCRAP_DATA] POST failed:', err.message);
    res.status(500).json({ error: 'Failed to create scrap damage' });
  }
});

// PUT /api/table/scrap-data/:id - Update scrap data (Admin only)
app.put('/api/table/scrap-data/:id', requireLogin, requireRole('Administrator'), async (req, res) => {
  try {
    const id = req.params.id;
    const { location, damage_code, damage_description } = req.body;

    if (!location || !damage_code || !damage_description) {
      return res.status(400).json({ error: 'Location, damage_code, and damage_description are required' });
    }

    const result = await pool.query(
      'UPDATE scrap_data SET location = $1, damage_code = $2, damage_description = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [location.toUpperCase(), damage_code.toUpperCase(), damage_description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scrap damage not found' });
    }

    logActivity(req.session.user.id, req.session.user.username, 'UPDATE_SCRAP_DAMAGE', `Updated damage code ${damage_code}`);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.constraint === 'scrap_data_location_damage_code_key') {
      return res.status(409).json({ error: 'This location/damage_code combination already exists' });
    }
    console.error('[SCRAP_DATA] PUT failed:', err.message);
    res.status(500).json({ error: 'Failed to update scrap damage' });
  }
});

// DELETE /api/table/scrap-data/:id - Delete scrap data (Admin only)
app.delete('/api/table/scrap-data/:id', requireLogin, requireRole('Administrator'), async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await pool.query('DELETE FROM scrap_data WHERE id = $1 RETURNING damage_code', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scrap damage not found' });
    }

    logActivity(req.session.user.id, req.session.user.username, 'DELETE_SCRAP_DATA', `Deleted damage code ${result.rows[0].damage_code}`);
    res.json({ message: 'Scrap data deleted' });
  } catch (err) {
    console.error('[SCRAP_DATA] DELETE failed:', err.message);
    res.status(500).json({ error: 'Failed to delete scrap data' });
  }
});

// ============================================================================
// TIRE ENDPOINTS (Admin dashboard - before generic routes)
// ============================================================================

// GET /api/table/tyres - Get all tyres
app.get('/api/table/tyres', async (req, res) => {
  try {
    console.log('[TYRES] GET request - user:', req.session?.user?.username || 'anonymous');
    const result = await pool.query('SELECT id, brand, pattern, "Ply Rating", "Original Tread Depth", "Load Rating", "Load Rating Duals", "Load Rating Singles", "Speed Rating Duals", "Speed Rating Singles", "Tube Rating", "Nominal Section Width", "Aspect Ratio", "Rim Size", "Product Code" FROM tyres ORDER BY brand, pattern');
    console.log('[TYRES] GET - returning', result.rows.length, 'records');
    res.json(result.rows);
  } catch (err) {
    console.error('[TYRES] GET failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch tyres' });
  }
});

// GET /api/table/tyres/:id - Get single tyre
app.get('/api/table/tyres/:id', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, brand, pattern, "Ply Rating", "Original Tread Depth", "Load Rating", "Load Rating Duals", "Load Rating Singles", "Speed Rating Duals", "Speed Rating Singles", "Tube Rating", "Nominal Section Width", "Aspect Ratio", "Rim Size", "Product Code" FROM tyres WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tyre not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[TYRES] GET by ID failed:', err.message);
    res.status(500).json({ error: 'Failed to fetch tyre' });
  }
});

// POST /api/table/tyres - Create new tyre (Admin only)
app.post('/api/table/tyres', requireLogin, requireRole('Administrator'), async (req, res) => {
  try {
    console.log('[TYRES] POST received, body:', req.body);
    const { brand, pattern, 'Ply Rating': plyRating, 'Original Tread Depth': originalTreadDepth, 'Load Rating': loadRating, 'Load Rating Duals': loadRatingDuals, 'Load Rating Singles': loadRatingSingles, 'Speed Rating Duals': speedRatingDuals, 'Speed Rating Singles': speedRatingSingles, 'Tube Rating': tubeRating, 'Nominal Section Width': nominalSectionWidth, 'Aspect Ratio': aspectRatio, 'Rim Size': rimSize, 'Product Code': productCode } = req.body;
    
    if (!brand || !pattern || !nominalSectionWidth || !aspectRatio || !rimSize) {
      console.log('[TYRES] Missing required fields');
      return res.status(400).json({ error: 'Brand, Pattern, Nominal Section Width, Aspect Ratio, and Rim Size are required' });
    }

    const result = await pool.query(
      'INSERT INTO tyres (brand, pattern, "Ply Rating", "Original Tread Depth", "Load Rating", "Load Rating Duals", "Load Rating Singles", "Speed Rating Duals", "Speed Rating Singles", "Tube Rating", "Nominal Section Width", "Aspect Ratio", "Rim Size", "Product Code") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [brand, pattern, plyRating, originalTreadDepth, loadRating, loadRatingDuals, loadRatingSingles, speedRatingDuals, speedRatingSingles, tubeRating, nominalSectionWidth, aspectRatio, rimSize, productCode]
    );

    console.log('[TYRES] POST successful, created:', result.rows[0]);
    logActivity(req.session.user.id, req.session.user.username, 'CREATE_TYRE', `Added tyre ${brand} ${pattern}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.constraint === 'tyres_brand_pattern_Nominal_Section_Width_Aspect_Ratio_Rim_Size_key') {
      return res.status(409).json({ error: 'This tyre already exists' });
    }
    console.error('[TYRES] POST failed:', err.message);
    res.status(500).json({ error: 'Failed to create tyre' });
  }
});

// PUT /api/table/tyres/:id - Update tyre (Admin only)
app.put('/api/table/tyres/:id', requireLogin, requireRole('Administrator'), async (req, res) => {
  try {
    const id = req.params.id;
    const { brand, pattern, 'Ply Rating': plyRating, 'Original Tread Depth': originalTreadDepth, 'Load Rating': loadRating, 'Load Rating Duals': loadRatingDuals, 'Load Rating Singles': loadRatingSingles, 'Speed Rating Duals': speedRatingDuals, 'Speed Rating Singles': speedRatingSingles, 'Tube Rating': tubeRating, 'Nominal Section Width': nominalSectionWidth, 'Aspect Ratio': aspectRatio, 'Rim Size': rimSize, 'Product Code': productCode } = req.body;

    if (!brand || !pattern || !nominalSectionWidth || !aspectRatio || !rimSize) {
      return res.status(400).json({ error: 'Brand, Pattern, Nominal Section Width, Aspect Ratio, and Rim Size are required' });
    }

    const result = await pool.query(
      'UPDATE tyres SET brand = $1, pattern = $2, "Ply Rating" = $3, "Original Tread Depth" = $4, "Load Rating" = $5, "Load Rating Duals" = $6, "Load Rating Singles" = $7, "Speed Rating Duals" = $8, "Speed Rating Singles" = $9, "Tube Rating" = $10, "Nominal Section Width" = $11, "Aspect Ratio" = $12, "Rim Size" = $13, "Product Code" = $14, updated_at = NOW() WHERE id = $15 RETURNING *',
      [brand, pattern, plyRating, originalTreadDepth, loadRating, loadRatingDuals, loadRatingSingles, speedRatingDuals, speedRatingSingles, tubeRating, nominalSectionWidth, aspectRatio, rimSize, productCode, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tyre not found' });
    }

    logActivity(req.session.user.id, req.session.user.username, 'UPDATE_TYRE', `Updated tyre ${brand} ${pattern}`);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.constraint === 'tyres_brand_pattern_Nominal_Section_Width_Aspect_Ratio_Rim_Size_key') {
      return res.status(409).json({ error: 'This tyre already exists' });
    }
    console.error('[TYRES] PUT failed:', err.message);
    res.status(500).json({ error: 'Failed to update tyre' });
  }
});

// DELETE /api/table/tyres/:id - Delete tyre (Admin only)
app.delete('/api/table/tyres/:id', requireLogin, requireRole('Administrator'), async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await pool.query('DELETE FROM tyres WHERE id = $1 RETURNING brand, pattern', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tyre not found' });
    }

    logActivity(req.session.user.id, req.session.user.username, 'DELETE_TYRE', `Deleted tyre ${result.rows[0].brand} ${result.rows[0].pattern}`);
    res.json({ message: 'Tyre deleted' });
  } catch (err) {
    console.error('[TYRES] DELETE failed:', err.message);
    res.status(500).json({ error: 'Failed to delete tyre' });
  }
});

// ============================================================================
// GENERIC TABLE ENDPOINTS (After specific routes)
// ============================================================================

// CRUD with table whitelist
app.get('/api/table/:key', requireLogin, async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    const { rows } = await pool.query(`SELECT * FROM "${req.params.key}"`);
    res.json(rows);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// POST /api/table/:key - Bulk upload (expects array of objects)
app.post('/api/table/:key', requireAdmin, async (req, res) => {
  const key = req.params.key;
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ error: 'No data provided' });
  }
  try {
    validateTableAccess(key);
    await ensureTable(key, data[0]);
    await pool.query(`DELETE FROM "${key}"`);
    for (const row of data) {
      const cols = Object.keys(row);
      const values = Object.values(row);
      const placeholders = cols.map((_, i) => `$${i + 1}`);
      await pool.query(`INSERT INTO "${key}" (${cols.map(k => `"${k}"`).join(', ')}) VALUES (${placeholders.join(', ')})`, values);
    }
    res.sendStatus(200);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

app.delete('/api/table/:key', requireAdmin, async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    await pool.query(`DROP TABLE IF EXISTS "${req.params.key}"`);
    res.sendStatus(200);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Utility: Clear Table Only
app.delete('/clear/:key', requireAdmin, async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    await pool.query(`DELETE FROM "${req.params.key}"`);
    res.sendStatus(200);
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// --- Scrap endpoints (authenticated users) ---------------------------------
// GET /api/scraps - returns scraps filtered by role
app.get('/api/scraps', requireLogin, async (req, res) => {
  try {
    // ensure table exists (safe no-op if present)
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
});

// POST /api/scraps - create or update a single scrap report
app.post('/api/scraps', requireLogin, async (req, res) => {
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
});


// Export Data - with table whitelist
app.get('/export/:key', requireLogin, async (req, res) => {
  try {
    validateTableAccess(req.params.key);
    const type = req.query.type || 'json';
    const { rows } = await pool.query(`SELECT * FROM "${req.params.key}"`);
    if (type === 'csv') {
      const parser = new Parser();
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${req.params.key}.csv`);
      return res.send(csv);
    } else {
      res.json(rows);
    }
  } catch (err) {
    res.status(403).json({ error: err.message });
  }
});

// Analytics
app.get('/api/stats', requireLogin, async (req, res) => {
  try {
    const tyreToday = await pool.query("SELECT COUNT(*) FROM tyres WHERE CURRENT_DATE = DATE(timestamp)");
    const vehicleTotal = await pool.query("SELECT COUNT(*) FROM vehicles");
    res.json({
      tyres_today: Number(tyreToday.rows[0].count),
      total_vehicles: Number(vehicleTotal.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== DRAFT MANAGEMENT API =====
// Drafts: auto-saved form data held on server, allows offline persistence and cross-device continuity

// GET /api/drafts - List all drafts for authenticated user
app.get('/api/drafts', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, form_type, form_name, last_saved, sync_status FROM user_drafts WHERE user_id = $1 ORDER BY last_saved DESC',
      [req.session.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drafts/:id - Retrieve specific draft
app.get('/api/drafts/:id', requireLogin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_drafts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.session.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    const draft = result.rows[0];
    if (typeof draft.draft_data === 'string') {
      draft.draft_data = JSON.parse(draft.draft_data);
    }
    res.json(draft);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drafts/save - Save or update a draft
app.post('/api/drafts/save', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { draftId, formType, formName, formData } = req.body;
    
    if (!formType || !formName) {
      return res.status(400).json({ error: 'formType and formName are required' });
    }
    
    if (draftId) {
      // Update existing draft
      const result = await pool.query(
        `UPDATE user_drafts 
         SET draft_data = $1, last_saved = NOW(), sync_status = 'pending'
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [JSON.stringify(formData), draftId, user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draft not found or not authorized' });
      }
      
      await logActivity({
        userId: user.id,
        username: user.username,
        activityType: 'DRAFT_UPDATE',
        activityDescription: `Updated draft: ${formName}`,
        tableName: 'user_drafts',
        recordId: draftId,
        ipAddress,
        userAgent
      });
      
      return res.json(result.rows[0]);
    } else {
      // Create new draft
      const result = await pool.query(
        `INSERT INTO user_drafts (user_id, form_type, form_name, draft_data, sync_status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [user.id, formType, formName, JSON.stringify(formData)]
      );
      
      await logActivity({
        userId: user.id,
        username: user.username,
        activityType: 'DRAFT_CREATE',
        activityDescription: `Created draft: ${formName}`,
        tableName: 'user_drafts',
        recordId: result.rows[0].id,
        ipAddress,
        userAgent
      });
      
      return res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DRAFT_SAVE_FAILED',
      activityDescription: `Failed to save draft`,
      tableName: 'user_drafts',
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DRAFT_001',
      errorMessage: err.message
    });
    
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/drafts/:id - Delete a draft
app.delete('/api/drafts/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const result = await pool.query(
      'DELETE FROM user_drafts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Draft not found or not authorized' });
    }
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DRAFT_DELETE',
      activityDescription: `Deleted draft ID: ${req.params.id}`,
      tableName: 'user_drafts',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== COMPANIES API =====
app.get('/api/companies', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/companies', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { name, contactName, email, phone } = req.body;
    const result = await pool.query(
      'INSERT INTO companies (name, contact_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, contactName, email, phone]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE',
      activityDescription: `Created company: ${name}`,
      tableName: 'companies',
      recordId: result.rows[0].id,
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE_FAILED',
      activityDescription: `Failed to create company`,
      tableName: 'companies',
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_001',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/companies/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { name, contactName, email, phone } = req.body;
    const result = await pool.query(
      'UPDATE companies SET name=$1, contact_name=$2, email=$3, phone=$4 WHERE id=$5 RETURNING *',
      [name, contactName, email, phone, req.params.id]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE',
      activityDescription: `Updated company: ${name}`,
      tableName: 'companies',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE_FAILED',
      activityDescription: `Failed to update company ID: ${req.params.id}`,
      tableName: 'companies',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_002',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/companies/:id', requireAdmin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    await pool.query('DELETE FROM companies WHERE id=$1', [req.params.id]);
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE',
      activityDescription: `Deleted company ID: ${req.params.id}`,
      tableName: 'companies',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent
    });
    
    res.json({ success: true });
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE_FAILED',
      activityDescription: `Failed to delete company ID: ${req.params.id}`,
      tableName: 'companies',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_003',
      errorMessage: err.message
    });
    
    res.status(500).json({ error: err.message });
  }
});

// ===== DEPOTS API =====
app.get('/api/depots', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM depots ORDER BY location');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/depots', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { location, contactName, email, phone, companyId } = req.body;
    const result = await pool.query(
      'INSERT INTO depots (location, contact_name, email, phone, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [location, contactName, email, phone, companyId]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE',
      activityDescription: `Created depot: ${location}`,
      tableName: 'depots',
      recordId: result.rows[0].id,
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE_FAILED',
      activityDescription: `Failed to create depot`,
      tableName: 'depots',
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_001',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/depots/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { location, contactName, email, phone, companyId } = req.body;
    const result = await pool.query(
      'UPDATE depots SET location=$1, contact_name=$2, email=$3, phone=$4, company_id=$5 WHERE id=$6 RETURNING *',
      [location, contactName, email, phone, companyId, req.params.id]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE',
      activityDescription: `Updated depot: ${location}`,
      tableName: 'depots',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE_FAILED',
      activityDescription: `Failed to update depot ID: ${req.params.id}`,
      tableName: 'depots',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_002',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/depots/:id', requireAdmin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    await pool.query('DELETE FROM depots WHERE id=$1', [req.params.id]);
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE',
      activityDescription: `Deleted depot ID: ${req.params.id}`,
      tableName: 'depots',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent
    });
    
    res.json({ success: true });
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE_FAILED',
      activityDescription: `Failed to delete depot ID: ${req.params.id}`,
      tableName: 'depots',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_003',
      errorMessage: err.message
    });
    
    res.status(500).json({ error: err.message });
  }
});

// ===== TYRES API =====
app.get('/api/tyres', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tyres ORDER BY brand, size');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tyres', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { brand, size, type } = req.body;
    const result = await pool.query(
      'INSERT INTO tyres (brand, size, type) VALUES ($1, $2, $3) RETURNING *',
      [brand, size, type]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE',
      activityDescription: `Created tyre: ${brand} ${size}`,
      tableName: 'tyres',
      recordId: result.rows[0].id,
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE_FAILED',
      activityDescription: `Failed to create tyre`,
      tableName: 'tyres',
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_001',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tyres/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { brand, size, type } = req.body;
    const result = await pool.query(
      'UPDATE tyres SET brand=$1, size=$2, type=$3 WHERE id=$4 RETURNING *',
      [brand, size, type, req.params.id]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE',
      activityDescription: `Updated tyre: ${brand} ${size}`,
      tableName: 'tyres',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE_FAILED',
      activityDescription: `Failed to update tyre ID: ${req.params.id}`,
      tableName: 'tyres',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_002',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tyres/:id', requireAdmin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    await pool.query('DELETE FROM tyres WHERE id=$1', [req.params.id]);
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE',
      activityDescription: `Deleted tyre ID: ${req.params.id}`,
      tableName: 'tyres',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent
    });
    
    res.json({ success: true });
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE_FAILED',
      activityDescription: `Failed to delete tyre ID: ${req.params.id}`,
      tableName: 'tyres',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_003',
      errorMessage: err.message
    });
    
    res.status(500).json({ error: err.message });
  }
});

// ===== VEHICLE CONFIGS API =====
app.get('/api/vehicle-configs', requireLogin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicle_configs ORDER BY item_code');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vehicle-configs', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { itemCode, name, tireConfig, tireSizes, idealPressures, pressureUnits, spares } = req.body;
    const result = await pool.query(
      'INSERT INTO vehicle_configs (item_code, name, tire_config, tire_sizes, ideal_pressures, pressure_units, spares) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [itemCode, name, tireConfig, JSON.stringify(tireSizes || {}), JSON.stringify(idealPressures || {}), JSON.stringify(pressureUnits || {}), spares || 0]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE',
      activityDescription: `Created vehicle config: ${itemCode} - ${name}`,
      tableName: 'vehicle_configs',
      recordId: result.rows[0].id,
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'CREATE_FAILED',
      activityDescription: `Failed to create vehicle config`,
      tableName: 'vehicle_configs',
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_001',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/vehicle-configs/:id', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    const { itemCode, name, tireConfig, tireSizes, idealPressures, pressureUnits, spares } = req.body;
    const result = await pool.query(
      'UPDATE vehicle_configs SET item_code=$1, name=$2, tire_config=$3, tire_sizes=$4, ideal_pressures=$5, pressure_units=$6, spares=$7 WHERE id=$8 RETURNING *',
      [itemCode, name, tireConfig, JSON.stringify(tireSizes || {}), JSON.stringify(idealPressures || {}), JSON.stringify(pressureUnits || {}), spares || 0, req.params.id]
    );
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE',
      activityDescription: `Updated vehicle config: ${itemCode} - ${name}`,
      tableName: 'vehicle_configs',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'UPDATE_FAILED',
      activityDescription: `Failed to update vehicle config ID: ${req.params.id}`,
      tableName: 'vehicle_configs',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_002',
      errorMessage: err.message,
      requestData: req.body
    });
    
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicle-configs/:id', requireAdmin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  try {
    await pool.query('DELETE FROM vehicle_configs WHERE id=$1', [req.params.id]);
    
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE',
      activityDescription: `Deleted vehicle config ID: ${req.params.id}`,
      tableName: 'vehicle_configs',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent
    });
    
    res.json({ success: true });
  } catch (err) {
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DELETE_FAILED',
      activityDescription: `Failed to delete vehicle config ID: ${req.params.id}`,
      tableName: 'vehicle_configs',
      recordId: parseInt(req.params.id),
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'DB_003',
      errorMessage: err.message
    });
    
    res.status(500).json({ error: err.message });
  }
});

// ===== USER SUGGESTIONS API (Non-Admin Data Entry) =====
// Create user_suggestions table if it doesn't exist
async function createSuggestionsTable() {
  try {
    const createSuggestionsSql = `
      CREATE TABLE IF NOT EXISTS "user_suggestions" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        suggestion_type TEXT NOT NULL,
        suggestion_data JSONB NOT NULL,
        status TEXT DEFAULT 'pending',
        admin_reviewed_by TEXT,
        admin_reviewed_at TIMESTAMP WITH TIME ZONE,
        admin_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_suggestions_status ON user_suggestions(status);
      CREATE INDEX IF NOT EXISTS idx_suggestions_user_id ON user_suggestions(user_id);
      CREATE INDEX IF NOT EXISTS idx_suggestions_type ON user_suggestions(suggestion_type);
    `;
    await pool.query(createSuggestionsSql);
    console.log('[DB] user_suggestions table ready');
  } catch (err) {
    console.error('[DB] Error creating suggestions table:', err.message);
  }
}
createSuggestionsTable();

// Submit a new suggestion (any logged-in user)
app.post('/api/suggestions', requireLogin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  
  // Only non-admins can suggest data
  if (user.role === 'Administrator') {
    return res.status(403).json({ error: 'Admins cannot submit suggestions - use database management instead' });
  }

  try {
    const { suggestionType, suggestionData } = req.body;

    // Validate suggestion type
    const allowedTypes = ['company', 'depot', 'tyre', 'vehicleConfig'];
    if (!allowedTypes.includes(suggestionType)) {
      return res.status(400).json({ error: 'Invalid suggestion type' });
    }

    // Validate suggestion data is not empty
    if (!suggestionData || Object.keys(suggestionData).length === 0) {
      return res.status(400).json({ error: 'Suggestion data is required' });
    }

    const result = await pool.query(
      `INSERT INTO user_suggestions (user_id, username, suggestion_type, suggestion_data, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING *`,
      [user.id, user.username, suggestionType, JSON.stringify(suggestionData)]
    );

    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DATA_SUGGESTION',
      activityDescription: `Submitted ${suggestionType} suggestion`,
      tableName: 'user_suggestions',
      recordId: result.rows[0].id,
      ipAddress,
      userAgent,
      requestData: req.body,
      responseData: result.rows[0]
    });

    res.json({
      message: 'Suggestion submitted successfully',
      suggestion: result.rows[0]
    });
  } catch (err) {
    console.error('Error submitting suggestion:', err);
    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'DATA_SUGGESTION_FAILED',
      activityDescription: `Failed to submit suggestion`,
      tableName: 'user_suggestions',
      ipAddress,
      userAgent,
      success: false,
      errorCode: 'SUGG_001',
      errorMessage: err.message,
      requestData: req.body
    });
    res.status(500).json({ error: err.message });
  }
});

// Get suggestions (admins and managers only)
app.get('/api/suggestions', requireManagerOrAdmin, async (req, res) => {
  const user = req.session.user;
  
  try {
    const { status = 'pending' } = req.query;

    let query = 'SELECT * FROM user_suggestions';
    const params = [];

    if (status !== 'all') {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Approve a suggestion (admins and managers only)
app.post('/api/suggestions/:id/approve', requireManagerOrAdmin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  const suggestionId = req.params.id;

  try {
    // Get the suggestion
    const suggestionResult = await pool.query(
      'SELECT * FROM user_suggestions WHERE id = $1',
      [suggestionId]
    );

    if (suggestionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const suggestion = suggestionResult.rows[0];

    if (suggestion.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve ${suggestion.status} suggestion` });
    }

    const data = suggestion.suggestion_data;
    let insertedRecord;

    // Add to appropriate master table based on suggestion type
    try {
      switch (suggestion.suggestion_type) {
        case 'company':
          const companyResult = await pool.query(
            'INSERT INTO companies (name, contact_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.companyName, data.contactPerson, data.email, data.phone]
          );
          insertedRecord = companyResult.rows[0];
          break;

        case 'depot':
          const depotResult = await pool.query(
            'INSERT INTO depots (location, contact_name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.depotName, data.manager, data.phone, data.phone]
          );
          insertedRecord = depotResult.rows[0];
          break;

        case 'tyre':
          const tyreResult = await pool.query(
            'INSERT INTO tyres (brand, size, type) VALUES ($1, $2, $3) RETURNING *',
            [data.brand, data.size, data.type]
          );
          insertedRecord = tyreResult.rows[0];
          break;

        case 'vehicleConfig':
          const configResult = await pool.query(
            'INSERT INTO vehicle_configs (item_code, name, tire_config, spares) VALUES ($1, $2, $3, $4) RETURNING *',
            [
              `CONFIG_${Date.now()}`,
              data.vehicleType,
              JSON.stringify({ axles: data.axles, totalWheels: data.totalWheels }),
              data.tyresPerAxle || 0
            ]
          );
          insertedRecord = configResult.rows[0];
          break;

        default:
          return res.status(400).json({ error: 'Unknown suggestion type' });
      }
    } catch (insertErr) {
      await logActivity({
        userId: user.id,
        username: user.username,
        activityType: 'SUGGESTION_APPROVE_FAILED',
        activityDescription: `Failed to insert approved suggestion into ${suggestion.suggestion_type} table`,
        tableName: 'user_suggestions',
        recordId: suggestionId,
        ipAddress,
        userAgent,
        success: false,
        errorCode: 'SUGG_002',
        errorMessage: insertErr.message
      });
      throw insertErr;
    }

    // Update suggestion status to approved
    const updateResult = await pool.query(
      `UPDATE user_suggestions 
       SET status = 'approved', admin_reviewed_by = $1, admin_reviewed_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [user.username, suggestionId]
    );

    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'SUGGESTION_APPROVED',
      activityDescription: `Approved ${suggestion.suggestion_type} suggestion from ${suggestion.username}`,
      tableName: 'user_suggestions',
      recordId: suggestionId,
      ipAddress,
      userAgent,
      requestData: { suggestion_id: suggestionId },
      responseData: updateResult.rows[0]
    });

    res.json({
      message: 'Suggestion approved and added to database',
      suggestion: updateResult.rows[0],
      insertedRecord: insertedRecord
    });
  } catch (err) {
    console.error('Error approving suggestion:', err);
    res.status(500).json({ error: err.message });
  }
});

// Reject a suggestion (admins and managers only)
app.post('/api/suggestions/:id/reject', requireManagerOrAdmin, async (req, res) => {
  const user = req.session.user;
  const ipAddress = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  const suggestionId = req.params.id;
  const { adminNotes } = req.body;

  try {
    // Get the suggestion
    const suggestionResult = await pool.query(
      'SELECT * FROM user_suggestions WHERE id = $1',
      [suggestionId]
    );

    if (suggestionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Suggestion not found' });
    }

    const suggestion = suggestionResult.rows[0];

    if (suggestion.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject ${suggestion.status} suggestion` });
    }

    // Update suggestion status to rejected
    const result = await pool.query(
      `UPDATE user_suggestions 
       SET status = 'rejected', admin_reviewed_by = $1, admin_reviewed_at = NOW(), admin_notes = $2
       WHERE id = $3
       RETURNING *`,
      [user.username, adminNotes, suggestionId]
    );

    await logActivity({
      userId: user.id,
      username: user.username,
      activityType: 'SUGGESTION_REJECTED',
      activityDescription: `Rejected ${suggestion.suggestion_type} suggestion from ${suggestion.username}. Reason: ${adminNotes}`,
      tableName: 'user_suggestions',
      recordId: suggestionId,
      ipAddress,
      userAgent,
      requestData: { suggestion_id: suggestionId, adminNotes },
      responseData: result.rows[0]
    });

    res.json({
      message: 'Suggestion rejected',
      suggestion: result.rows[0]
    });
  } catch (err) {
    console.error('Error rejecting suggestion:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Zuri backend running at http://localhost:${PORT}`);
});

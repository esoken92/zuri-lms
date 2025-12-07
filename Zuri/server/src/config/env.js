const path = require('path');
const fs = require('fs');

// Required environment variables
const requiredEnvVars = [
  'SESSION_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

// Optional environment variables with defaults
const envConfig = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 54321,
  DB_NAME: process.env.DB_NAME || 'zuri_lms',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  SESSION_SECRET: process.env.SESSION_SECRET,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10485760, // 10MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(__dirname, '../uploads'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_DIR: process.env.LOG_DIR || path.join(__dirname, '../logs')
};

/**
 * Validates that all required environment variables are set
 * @throws {Error} If any required environment variables are missing
 */
function validateEnvironment() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    console.error('\n📋 Please check your .env file or set these environment variables.');
    console.error('📄 See .env.example for the complete list of required variables.');
    process.exit(1);
  }

  // Validate SESSION_SECRET length
  if (envConfig.SESSION_SECRET && envConfig.SESSION_SECRET.length < 32) {
    console.warn('⚠️  SESSION_SECRET is shorter than recommended (32+ characters)');
    console.warn('   Consider generating a longer, more secure secret.');
  }

  console.log('✅ Environment variables validated successfully');
}

/**
 * Creates necessary directories if they don't exist
 */
function ensureDirectories() {
  const dirs = [envConfig.UPLOAD_DIR, envConfig.LOG_DIR];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Gets the current environment configuration
 * @returns {Object} Environment configuration object
 */
function getConfig() {
  return { ...envConfig };
}

module.exports = {
  validateEnvironment,
  ensureDirectories,
  getConfig
};
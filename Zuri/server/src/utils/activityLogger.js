const { pool, db } = require('../config/database');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// File logging function
const logToFile = (username, message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${username || 'SYSTEM'}: ${message}\n`;

  // Create user-specific log directory
  const userLogDir = path.join(logsDir, username || 'anonymous');
  if (!fs.existsSync(userLogDir)) {
    fs.mkdirSync(userLogDir, { recursive: true });
  }

  const logFile = path.join(userLogDir, `${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logEntry);
};

// Activity logging function
// Supports multiple call signatures for backward compatibility:
//  - logActivity(req, activityData)
//  - logActivity(activityData)
//  - logActivity(userId, username, activityType, activityDescription)
const logActivity = async (...args) => {
  try {
    let req = null;
    let activityData = {};

    if (args.length === 2 && args[0] && args[0].headers) {
      req = args[0];
      activityData = args[1] || {};
    } else if (args.length === 1 && typeof args[0] === 'object') {
      activityData = args[0] || {};
    } else if (args.length >= 3) {
      // older style: userId, username, activityType, description
      const [userId, username, activityType, activityDescription] = args;
      activityData = { userId, username, activityType, activityDescription };
    }

    const sessionUser = req?.session?.user;
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    const activityRecord = {
      user_id: sessionUser?.id || activityData.userId || null,
      username: sessionUser?.username || activityData.username || 'SYSTEM',
      activity_type: activityData.activity_type || activityData.activityType,
      activity_description: activityData.activity_description || activityData.activityDescription || activityData.activityDescription,
      table_name: activityData.table_name || activityData.tableName || null,
      record_id: activityData.record_id || activityData.recordId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_data: activityData.request_data || activityData.requestData ? JSON.stringify(activityData.request_data || activityData.requestData) : null,
      response_data: activityData.response_data || activityData.responseData ? JSON.stringify(activityData.response_data || activityData.responseData) : null,
      error_code: activityData.error_code || activityData.errorCode || null,
      error_message: activityData.error_message || activityData.errorMessage || null,
      success: activityData.success !== undefined ? activityData.success : true,
      client_info: activityData.client_info || activityData.clientInfo ? JSON.stringify(activityData.client_info || activityData.clientInfo) : null
    };

    // Try DB first (Postgres pool or SQLite db). If DB not available or fails, fall back to file logging.
    const columns = Object.keys(activityRecord);
    const values = Object.values(activityRecord);

    if (pool && typeof pool.query === 'function') {
      // PostgreSQL style ($1, $2, ...)
      const placeholders = columns.map((_, i) => `$${i + 1}`);
      const sql = `INSERT INTO activity_logs (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;
      try {
        await pool.query(sql, values);
        return;
      } catch (err) {
        console.error('[ACTIVITY_LOG] Postgres insert failed:', err.message);
        // fallthrough to file logging
      }
    }

    if (db && typeof db.run === 'function') {
      // SQLite style (?, ?, ...)
      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO activity_logs (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
      try {
        await new Promise((resolve, reject) => {
          db.run(sql, values, function (err) {
            if (err) return reject(err);
            resolve(this.lastID);
          });
        });
        return;
      } catch (err) {
        console.error('[ACTIVITY_LOG] SQLite insert failed:', err.message);
        // fallthrough to file logging
      }
    }

    // If we reach here, DB wasn't available or both inserts failed — log to file as a safe fallback
    try {
      logToFile(activityRecord.username, activityRecord.activity_description || JSON.stringify(activityRecord));
    } catch (fileErr) {
      console.error('[ACTIVITY_LOG] Fallback file logging failed:', fileErr.message);
    }
  } catch (err) {
    console.error('[ACTIVITY_LOG] Unexpected error while logging activity:', err.message);
    // Swallow errors to avoid breaking main flow
  }
};

module.exports = {
  logToFile,
  logActivity
};
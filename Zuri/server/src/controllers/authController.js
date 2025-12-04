const bcrypt = require('bcrypt');
const { pool, db } = require('../config/database');
const { logActivity } = require('../utils/activityLogger');
const { getClientIp, parseUserAgent } = require('../utils/clientInfo');

// Login controller
const login = async (req, res) => {
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
};

// Logout controller
const logout = async (req, res) => {
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
};

// Developer-only login: map to a real DB user when possible (Postgres pool or SQLite db).
const devLogin = async (req, res) => {
  const { username = 'developer', role = 'Administrator' } = req.body || {};

  try {
    let user = null;

    // Try Postgres pool first
    if (pool && typeof pool.query === 'function') {
      const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      user = rows[0];

      if (!user) {
        const password_hash = await bcrypt.hash('developer', 10);
        const insert = await pool.query(
          'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
          [username, password_hash, role]
        );
        user = insert.rows[0];
      }
    } else if (db && typeof db.get === 'function') {
      // SQLite path
      user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });

      if (!user) {
        const password_hash = await bcrypt.hash('developer', 10);
        const lastId = await new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            [username, password_hash, role],
            function (err) {
              if (err) return reject(err);
              resolve(this.lastID);
            }
          );
        });

        user = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM users WHERE id = ?', [lastId], (err, row) => {
            if (err) return reject(err);
            resolve(row);
          });
        });
      }
    }

    // Fallback: if no DB available, create an in-memory session user
    if (!user) {
      req.session.user = { id: 0, username, role };
      await logActivity(req, {
        activityType: 'DEV_LOGIN_SESSION_CREATED',
        activityDescription: `Created in-memory developer session for ${username}`
      });
      return res.json({ message: 'Developer logged in (in-memory session)', user: req.session.user });
    }

    // Map session to DB user
    req.session.user = { id: user.id, username: user.username, role: user.role };

    await logActivity(req, {
      userId: user.id,
      username: user.username,
      activityType: 'DEV_LOGIN',
      activityDescription: `Developer login mapped to DB user ${user.username}`
    });

    return res.json({ message: 'Developer logged in', user: req.session.user });
  } catch (err) {
    console.error('[DEV_LOGIN] Error during developer login:', err.message);
    return res.status(500).json({ error: 'Developer login failed', details: err.message });
  }
};

module.exports = {
  login,
  logout,
  devLogin
};
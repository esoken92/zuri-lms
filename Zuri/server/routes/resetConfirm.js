const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const router = express.Router();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'zuri',
  password: 'zuri1234',
  port: 54321,
});

router.post('/', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password required' });
  }

  try {
    const result = await pool.query(
      'SELECT username, expires_at FROM password_reset_tokens WHERE token = $1',
      [token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const { username, expires_at } = result.rows[0];
    const now = new Date();

    if (now > expires_at) {
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      return res.status(400).json({ message: 'Token expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [
      passwordHash,
      username,
    ]);

    await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);

    console.log(`[RESET SUCCESS] Password changed for ${username}`);
    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset failed:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

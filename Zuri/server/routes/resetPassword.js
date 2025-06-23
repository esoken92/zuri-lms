// server/routes/resetPassword.js
const express = require('express');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const pool = new Pool(); // Assumes env config
const APP_BASE_URL = process.env.APP_BASE_URL;

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/reset-password
router.post('/', async (req, res) => {
  const { username } = req.body;

  if (!username) return res.status(400).json({ message: 'Username is required' });

  try {
    const userResult = await pool.query('SELECT email FROM users WHERE username = $1', [username]);
    if (userResult.rowCount === 0) {
      console.log(`[AUDIT] Invalid reset request for non-existent username: ${username}`);
      return res.status(200).json({ message: 'If the username is valid, a reset email has been sent.' });
    }

    const email = userResult.rows[0].email;
    if (!email) {
      return res.status(200).json({ message: 'No email associated with this account.' });
    }

    const token = uuidv4();
    const tokenId = uuidv4();
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    await pool.query(
      'INSERT INTO password_reset_tokens (id, username, token, expires_at) VALUES ($1, $2, $3, $4)',
      [tokenId, username, token, expires]
    );

    const resetLink = `${APP_BASE_URL}/reset-password?token=${token}`;

    const html = `
      <h2>Reset Your Zuri Password</h2>
      <p>Hello ${username},</p>
      <p>You requested a password reset. Click the button below to proceed:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#1e90ff;color:#fff;text-decoration:none;border-radius:5px;">
        Reset Password
      </a>
      <p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>
      <p>Regards,<br/>Zuri Support</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Zuri Password Reset',
      html,
    });

    console.log(`[AUDIT] Password reset email sent to ${username}`);
    res.status(200).json({ message: 'Reset email sent if user exists.' });
  } catch (err) {
    console.error(`[ERROR] Password reset failed: ${err.message}`);
    res.status(500).json({ message: 'Internal error.' });
  }
});

module.exports = router;

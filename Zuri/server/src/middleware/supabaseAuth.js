const supabaseAuthService = require('../services/supabaseAuth');

/**
 * Supabase Auth Middleware
 * Validates Supabase JWT tokens and attaches user to request
 */

const useSupabase = process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production';

/**
 * Middleware to require Supabase authentication
 */
const requireSupabaseAuth = async (req, res, next) => {
  // If not using Supabase, fall back to session-based auth
  if (!useSupabase) {
    const { requireLogin } = require('./auth');
    return requireLogin(req, res, next);
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const user = await supabaseAuthService.verifyToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user to request
    req.user = user;
    req.session = { user }; // For backward compatibility

    next();
  } catch (error) {
    console.error('[SUPABASE_AUTH] Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = async (req, res, next) => {
  if (!useSupabase) {
    // Fall back to existing admin check
    if (!req.user || req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    return next();
  }

  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  if (!useSupabase) {
    // For session-based auth, just continue
    if (req.session && req.session.user) {
      req.user = req.session.user;
    }
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await supabaseAuthService.verifyToken(token);
      if (user) {
        req.user = user;
        req.session = { user };
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
    console.warn('[SUPABASE_AUTH] Optional auth failed:', error.message);
  }

  next();
};

module.exports = {
  requireSupabaseAuth,
  requireAdmin,
  optionalAuth
};

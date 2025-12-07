// Authentication middleware
const requireLogin = (req, res, next) => {
  console.log('[AUTH] requireLogin check - session:', !!req.session, 'user:', !!req.session?.user, 'path:', req.path);
  if (!req.session.user) {
    console.log('[AUTH] requireLogin DENIED - not logged in');
    return res.status(401).json({ error: 'Not logged in' });
  }
  console.log('[AUTH] requireLogin OK - user:', req.session.user.email);
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'Administrator') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

const requireRole = (role) => {
  return function (req, res, next) {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).json({ error: `${role} access required` });
    }
    next();
  };
};

const requireManagerOrAdmin = (req, res, next) => {
  if (!req.session.user || (req.session.user.role !== 'Administrator' && req.session.user.role !== 'Group Manager')) {
    return res.status(403).json({ error: 'Manager or admin access required' });
  }
  next();
};

module.exports = {
  requireLogin,
  requireAdmin,
  requireRole,
  requireManagerOrAdmin
};
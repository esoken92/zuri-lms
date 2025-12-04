// Developer mode configuration
// Controls development-only features like auto-login and debugging tools
// Enable developer mode when not in production OR when explicitly set
const isDeveloperMode = (process.env.NODE_ENV !== 'production') ||
                       process.env.DEVELOPER_MODE === 'true';

console.log(`[DEV_MODE] Developer mode: ${isDeveloperMode ? 'ENABLED' : 'DISABLED'}`);
console.log(`[DEV_MODE] Environment: ${process.env.NODE_ENV}`);
console.log(`[DEV_MODE] DEVELOPER_MODE env var: ${process.env.DEVELOPER_MODE}`);

module.exports = {
  isDeveloperMode,

  // Middleware to require developer mode for certain endpoints
  requireDeveloperMode: (req, res, next) => {
    if (!isDeveloperMode) {
      console.warn(`[DEV_MODE] Access denied: Developer mode not enabled for ${req.path}`);
      return res.status(403).json({
        error: 'Developer mode not enabled',
        message: 'This feature is only available in development mode'
      });
    }
    next();
  }
};
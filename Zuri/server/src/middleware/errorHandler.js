const { logActivity } = require('../utils/activityLogger');

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  const time = new Date().toISOString();
  const logMsg = `[ERROR] ${req.method} ${req.originalUrl} - ${err.message}`;
  console.error(`${logMsg}`);
  console.error(err.stack);

  // Log error activity if user is authenticated
  if (req.session?.user) {
    logActivity(req, {
      activity_type: 'SYSTEM_ERROR',
      activity_description: `System error: ${err.message}`,
      error_code: 'SYS_ERROR',
      success: false
    });
  }

  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };

  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

module.exports = {
  errorHandler
};
// Client information utilities
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         'unknown';
};

const parseUserAgent = (userAgent) => {
  if (!userAgent) return { browser: 'unknown', os: 'unknown', device: 'unknown' };

  // Simple user agent parsing (can be enhanced with a library like ua-parser-js)
  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = 'unknown';
  let browserVersion = 'unknown';

  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    const match = ua.match(/chrome\/([\d.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
    const match = ua.match(/firefox\/([\d.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    const match = ua.match(/version\/([\d.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    const match = ua.match(/edg\/([\d.]+)/);
    browserVersion = match ? match[1] : 'unknown';
  }

  // OS detection
  let os = 'unknown';
  let osVersion = 'unknown';

  if (ua.includes('windows')) {
    os = 'Windows';
    if (ua.includes('windows nt 10')) osVersion = '10';
    else if (ua.includes('windows nt 6.3')) osVersion = '8.1';
    else if (ua.includes('windows nt 6.2')) osVersion = '8';
    else if (ua.includes('windows nt 6.1')) osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    const match = ua.match(/mac os x ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'unknown';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
    const match = ua.match(/android ([\d.]+)/);
    osVersion = match ? match[1] : 'unknown';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    const match = ua.match(/os ([\d_]+)/);
    osVersion = match ? match[1].replace(/_/g, '.') : 'unknown';
  }

  // Device type detection
  let device = 'desktop';
  let deviceType = 'desktop';

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    device = 'mobile';
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    device = 'tablet';
    deviceType = 'tablet';
  }

  return {
    browser,
    browserVersion,
    os,
    osVersion,
    device,
    deviceType,
    platform: os.toLowerCase()
  };
};

module.exports = {
  getClientIp,
  parseUserAgent
};
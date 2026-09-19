require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET,
  dbPath: process.env.DB_PATH || './db/tdps.db',
  sessionStorePath: process.env.SESSION_STORE_PATH || './sessions',
  nodeEnv: process.env.NODE_ENV || 'development',
  lowRiskThreshold: parseInt(process.env.LOW_RISK_THRESHOLD, 10) || 3,
  highRiskThreshold: parseInt(process.env.HIGH_RISK_THRESHOLD, 10) || 6,
  riskWindowMinutes: parseInt(process.env.RISK_WINDOW_MINUTES, 10) || 15,
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
  recaptchaSecretKey: process.env.RECAPTCHA_SECRET_KEY,
  adminUsername: process.env.ADMIN_USERNAME,
  adminPassword: process.env.ADMIN_PASSWORD,
  schoolPortalUrl: process.env.SCHOOL_PORTAL_URL
};

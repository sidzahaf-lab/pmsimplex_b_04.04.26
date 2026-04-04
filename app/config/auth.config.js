// backend/app/config/auth.config.js
export default {
  secret: process.env.JWT_SECRET || 'pmsimplex-super-secret-key-change-in-production-2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'pmsimplex-refresh-secret-key-2026',
  jwtExpiration: 86400, // 24 hours in seconds
  jwtRefreshExpiration: 2592000, // 30 days in seconds
  bcryptRounds: 12
};
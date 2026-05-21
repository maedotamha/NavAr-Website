const path = require('node:path');
const dotenv = require('dotenv');

const rootEnv = path.resolve(__dirname, '../../../.env');
const backendEnv = path.resolve(__dirname, '../../.env');

dotenv.config({ path: rootEnv });
dotenv.config({ path: backendEnv, override: true });
dotenv.config();

module.exports = {
  port: Number(process.env.BACKEND_PORT || process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001').split(',').map(origin => origin.trim()).filter(Boolean),
  corsOriginPatterns: (process.env.CORS_ORIGIN_PATTERNS || '^https://nav-ar-website(?:-[a-z0-9-]+)?\\.vercel\\.app$').split(',').map(pattern => pattern.trim()).filter(Boolean),
  nodeEnv: process.env.NODE_ENV || 'development',
  authSecret: process.env.AUTH_SECRET || 'dev-only-change-this-secret',
  adminTokenTtlSeconds: Number(process.env.ADMIN_TOKEN_TTL_SECONDS || 8 * 60 * 60),
  outdoorNavApiUrl: (process.env.OUTDOOR_NAV_API_URL || '').replace(/\/+$/, '')
};

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  portRetryCount: Number(process.env.PORT_RETRY_COUNT || 10),
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/auto_connect",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  jwtCookieExpiresDays: Number(process.env.JWT_COOKIE_EXPIRES_DAYS || 1),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  fastApiBaseUrl: process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8011",
  fastApiTimeoutMs: Number(process.env.FASTAPI_TIMEOUT_MS || 10000),
};

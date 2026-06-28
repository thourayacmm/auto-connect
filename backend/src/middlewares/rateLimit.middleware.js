const rateLimit = require("express-rate-limit");
const env = require("../config/env");

const isDevelopment = env.nodeEnv !== "production";

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDevelopment ? 1000 : 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Reessayez dans quelques minutes.",
  },
});

const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isDevelopment ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Trop de requetes. Reessayez dans quelques minutes.",
  },
});

module.exports = { authRateLimit, globalRateLimit };

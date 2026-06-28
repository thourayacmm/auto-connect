const express = require("express");
const { validate } = require("../../middlewares/validate.middleware");
const { protect } = require("../../middlewares/auth.middleware");
const { authRateLimit } = require("../../middlewares/rateLimit.middleware");
const controller = require("./auth.controller");
const { childSessionSchema, loginSchema, registerSchema } = require("./auth.validator");

const router = express.Router();

router.post("/register", authRateLimit, validate(registerSchema), controller.register);
router.post("/login", authRateLimit, validate(loginSchema), controller.login);
router.post("/child-session", authRateLimit, validate(childSessionSchema), controller.childSession);
router.get("/me", protect, controller.me);
router.post("/logout", protect, controller.logout);

module.exports = { authRouter: router };

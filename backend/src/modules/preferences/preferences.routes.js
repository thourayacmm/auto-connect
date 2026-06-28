const express = require("express");
const { optionalProtect, protect } = require("../../middlewares/auth.middleware");
const controller = require("./preferences.controller");

const router = express.Router();

router.get("/", optionalProtect, controller.getPreferences);
router.use(protect);
router.put("/", controller.updatePreferences);

module.exports = { preferencesRouter: router };

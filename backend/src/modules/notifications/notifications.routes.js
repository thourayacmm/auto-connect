const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const controller = require("./notifications.controller");

const router = express.Router();

router.use(protect);
router.get("/", controller.list);

module.exports = { notificationsRouter: router };

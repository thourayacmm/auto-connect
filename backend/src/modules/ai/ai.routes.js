const express = require("express");
const multer = require("multer");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./ai.controller");
const {
  adaptLevelSchema,
  analyzeSchema,
  chatSchema,
  correctPhraseSchema,
  recommendSchema,
  scoreSchema,
} = require("./ai.validator");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/health", controller.health);

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD));

router.post("/analyze", authorizePermission("ai", PERMISSIONS.AI_USE), validate(analyzeSchema), controller.analyze);
router.post("/recommend", authorizePermission("ai", PERMISSIONS.AI_USE), validate(recommendSchema), controller.recommend);
router.post("/score", authorizePermission("ai", PERMISSIONS.AI_USE), validate(scoreSchema), controller.score);
router.post("/adapt-level", authorizePermission("ai", PERMISSIONS.AI_USE), validate(adaptLevelSchema), controller.adaptLevel);
router.post("/correct-phrase", authorizePermission("ai", PERMISSIONS.AI_USE), validate(correctPhraseSchema), controller.correctPhrase);
router.post("/chat", authorizePermission("ai", PERMISSIONS.AI_USE), validate(chatSchema), controller.chat);
router.post("/stt", authorizePermission("ai", PERMISSIONS.AI_USE), upload.single("audio_file"), controller.speechToText);

module.exports = { aiRouter: router };

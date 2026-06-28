const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./sessions.controller");
const { endSessionSchema, idParamSchema, listSessionsQuerySchema, startSessionSchema } = require("./sessions.validator");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD));

router.post("/start", authorizePermission("sessions", PERMISSIONS.SESSIONS_WRITE), validate(startSessionSchema), controller.startSession);
router.post("/end", authorizePermission("sessions", PERMISSIONS.SESSIONS_WRITE), validate(endSessionSchema), controller.endSession);
router.get("/", authorizePermission("sessions", PERMISSIONS.SESSIONS_READ), validate(listSessionsQuerySchema, "query"), controller.listSessions);
router.get("/:id", authorizePermission("sessions", PERMISSIONS.SESSIONS_READ), validate(idParamSchema, "params"), controller.getSession);

module.exports = { sessionsRouter: router };

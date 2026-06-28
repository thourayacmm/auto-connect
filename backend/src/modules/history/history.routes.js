const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./history.controller");
const { createHistorySchema, kidIdParamSchema, listHistoryQuerySchema } = require("./history.validator");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD));

router.post("/", authorizePermission("history", PERMISSIONS.HISTORY_WRITE), validate(createHistorySchema), controller.createHistory);
router.get("/", authorizePermission("history", PERMISSIONS.HISTORY_READ), validate(listHistoryQuerySchema, "query"), controller.listHistory);
router.get("/:kidId", authorizePermission("history", PERMISSIONS.HISTORY_READ), validate(kidIdParamSchema, "params"), controller.getHistoryByKid);

module.exports = { historyRouter: router };

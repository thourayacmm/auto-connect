const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./analytics.controller");
const { objectId, z } = require("../../validators/common.validators");

const router = express.Router();
const idParamSchema = z.object({ id: objectId });

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST));

router.get("/dashboard", authorizePermission("analytics", PERMISSIONS.ANALYTICS_READ), controller.dashboard);
router.get("/kid/:id", authorizePermission("analytics", PERMISSIONS.ANALYTICS_READ), validate(idParamSchema, "params"), controller.kidAnalytics);
router.get("/global", authorizeRoles(ROLES.ADMIN), authorizePermission("analytics", PERMISSIONS.ANALYTICS_READ), controller.globalAnalytics);

module.exports = { analyticsRouter: router };

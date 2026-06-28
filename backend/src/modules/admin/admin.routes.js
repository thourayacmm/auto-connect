const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./admin.controller");
const { updateAccessControlSchema } = require("./admin.validator");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN));

router.get("/overview", controller.overview);
router.get("/statistics", controller.statistics);
router.get("/audit", controller.audit);
router.get("/access-control", authorizePermission("access-control", PERMISSIONS.ACCESS_CONTROL_WRITE), controller.accessControl);
router.put("/access-control", authorizePermission("access-control", PERMISSIONS.ACCESS_CONTROL_WRITE), validate(updateAccessControlSchema), controller.updateAccessControl);

module.exports = { adminRouter: router };

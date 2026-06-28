const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./kids.controller");
const {
  assignUserSchema,
  createKidSchema,
  idParamSchema,
  listKidsQuerySchema,
  updateKidSchema,
} = require("./kids.validator");

const router = express.Router();

router.use(protect);

router.post("/", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST), authorizePermission("kids", PERMISSIONS.KIDS_WRITE), validate(createKidSchema), controller.createKid);
router.get("/", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST), authorizePermission("kids", PERMISSIONS.KIDS_READ), validate(listKidsQuerySchema, "query"), controller.listKids);
router.get("/:id", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("kids", PERMISSIONS.KIDS_READ), validate(idParamSchema, "params"), controller.getKid);
router.put("/:id", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST), authorizePermission("kids", PERMISSIONS.KIDS_WRITE), validate(idParamSchema, "params"), validate(updateKidSchema), controller.updateKid);
router.delete("/:id", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST), authorizePermission("kids", PERMISSIONS.KIDS_WRITE), validate(idParamSchema, "params"), controller.deleteKid);

router.patch("/:id/assign-parent", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("kids", PERMISSIONS.KIDS_WRITE), validate(idParamSchema, "params"), validate(assignUserSchema), controller.assignParent);
router.patch(
  "/:id/assign-therapist",
  authorizeRoles(ROLES.ADMIN),
  authorizePermission("kids", PERMISSIONS.KIDS_WRITE),
  validate(idParamSchema, "params"),
  validate(assignUserSchema),
  controller.assignTherapist,
);

router.get("/:id/progress", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("kids", PERMISSIONS.KIDS_READ), validate(idParamSchema, "params"), controller.getKidProgress);
router.get("/:id/history", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("kids", PERMISSIONS.KIDS_READ), validate(idParamSchema, "params"), controller.getKidHistory);
router.get("/:id/recommendations", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("kids", PERMISSIONS.KIDS_READ), validate(idParamSchema, "params"), controller.getKidRecommendations);
router.get("/:id/sessions", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("kids", PERMISSIONS.KIDS_READ), validate(idParamSchema, "params"), controller.getKidSessions);

module.exports = { kidsRouter: router };

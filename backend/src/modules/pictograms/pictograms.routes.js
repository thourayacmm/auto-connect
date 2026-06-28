const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./pictograms.controller");
const {
  categoryParamSchema,
  createPictogramSchema,
  idParamSchema,
  listPictogramsQuerySchema,
  updatePictogramSchema,
} = require("./pictograms.validator");

const router = express.Router();

router.use(protect);

router.get("/search", authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_READ), controller.searchPictograms);
router.get("/category/:categoryId", authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_READ), validate(categoryParamSchema, "params"), controller.listByCategory);
router.get("/", authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_READ), validate(listPictogramsQuerySchema, "query"), controller.listPictograms);
router.get("/:id", authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_READ), validate(idParamSchema, "params"), controller.getPictogram);

router.post("/", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_WRITE), validate(createPictogramSchema), controller.createPictogram);
router.put("/:id", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_WRITE), validate(idParamSchema, "params"), validate(updatePictogramSchema), controller.updatePictogram);
router.delete("/:id", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("pictograms", PERMISSIONS.PICTOGRAMS_WRITE), validate(idParamSchema, "params"), controller.deletePictogram);

module.exports = { pictogramsRouter: router };

const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./user.controller");
const {
  createUserSchema,
  idParamSchema,
  listUsersQuerySchema,
  updateStatusSchema,
  updateUserSchema,
} = require("./user.validator");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST));

router.get("/", authorizePermission("users", PERMISSIONS.USERS_READ), validate(listUsersQuerySchema, "query"), controller.listUsers);
router.get("/:id", authorizePermission("users", PERMISSIONS.USERS_READ), validate(idParamSchema, "params"), controller.getUser);
router.post("/", authorizePermission("users", PERMISSIONS.USERS_WRITE), validate(createUserSchema), controller.createUser);
router.put("/:id", authorizePermission("users", PERMISSIONS.USERS_WRITE), validate(idParamSchema, "params"), validate(updateUserSchema), controller.updateUser);
router.patch("/:id/status", authorizePermission("users", PERMISSIONS.USERS_WRITE), validate(idParamSchema, "params"), validate(updateStatusSchema), controller.updateStatus);
router.delete("/:id", authorizePermission("users", PERMISSIONS.USERS_WRITE), validate(idParamSchema, "params"), controller.deleteUser);

module.exports = { usersRouter: router };

const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./scenarios.controller");
const {
  assignKidSchema,
  createScenarioSchema,
  idParamSchema,
  listScenariosQuerySchema,
  updateScenarioSchema,
} = require("./scenarios.validator");

const router = express.Router();

router.use(protect);

router.get("/", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("scenarios", PERMISSIONS.SCENARIOS_READ), validate(listScenariosQuerySchema, "query"), controller.listScenarios);
router.get("/:id", authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD), authorizePermission("scenarios", PERMISSIONS.SCENARIOS_READ), validate(idParamSchema, "params"), controller.getScenario);

router.post("/", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("scenarios", PERMISSIONS.SCENARIOS_WRITE), validate(createScenarioSchema), controller.createScenario);
router.put("/:id", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("scenarios", PERMISSIONS.SCENARIOS_WRITE), validate(idParamSchema, "params"), validate(updateScenarioSchema), controller.updateScenario);
router.delete("/:id", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("scenarios", PERMISSIONS.SCENARIOS_WRITE), validate(idParamSchema, "params"), controller.deleteScenario);
router.patch("/:id/assign-kid", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("scenarios", PERMISSIONS.SCENARIOS_WRITE), validate(idParamSchema, "params"), validate(assignKidSchema), controller.assignKid);

module.exports = { scenariosRouter: router };

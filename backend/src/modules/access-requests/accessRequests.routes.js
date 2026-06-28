const express = require("express");
const { ROLES } = require("../../constants/roles");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const controller = require("./accessRequests.controller");
const {
  createAccessRequestSchema,
  idParamSchema,
  listAccessRequestsQuerySchema,
  updateAccessRequestStatusSchema,
} = require("./accessRequests.validator");

const router = express.Router();

router.use(protect, authorizeRoles(ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST));

router.get("/", validate(listAccessRequestsQuerySchema, "query"), controller.list);
router.post("/", authorizeRoles(ROLES.THERAPIST), validate(createAccessRequestSchema), controller.create);
router.patch(
  "/:id/status",
  authorizeRoles(ROLES.ADMIN),
  validate(idParamSchema, "params"),
  validate(updateAccessRequestStatusSchema),
  controller.updateStatus,
);

module.exports = { accessRequestsRouter: router };

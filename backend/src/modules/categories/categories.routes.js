const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizePermission } = require("../../middlewares/permission.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const { validate } = require("../../middlewares/validate.middleware");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const controller = require("./categories.controller");
const { createCategorySchema, idParamSchema, listCategoriesQuerySchema, updateCategorySchema } = require("./categories.validator");

const router = express.Router();

router.use(protect);

router.get("/", authorizePermission("categories", PERMISSIONS.CATEGORIES_READ), validate(listCategoriesQuerySchema, "query"), controller.listCategories);
router.get("/:id", authorizePermission("categories", PERMISSIONS.CATEGORIES_READ), validate(idParamSchema, "params"), controller.getCategory);

router.post("/", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("categories", PERMISSIONS.CATEGORIES_WRITE), validate(createCategorySchema), controller.createCategory);
router.put("/:id", authorizeRoles(ROLES.ADMIN, ROLES.THERAPIST), authorizePermission("categories", PERMISSIONS.CATEGORIES_WRITE), validate(idParamSchema, "params"), validate(updateCategorySchema), controller.updateCategory);
router.delete("/:id", authorizeRoles(ROLES.ADMIN), authorizePermission("categories", PERMISSIONS.CATEGORIES_WRITE), validate(idParamSchema, "params"), controller.deleteCategory);

module.exports = { categoriesRouter: router };

const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./categories.service");

const createCategory = catchAsync(async (req, res) => {
  const data = await service.createCategory(req.body);
  return successResponse(res, { statusCode: 201, message: "Category created successfully", data });
});

const listCategories = catchAsync(async (req, res) => {
  const result = await service.listCategories(req.query);
  return successResponse(res, { message: "Categories fetched successfully", data: result.items, meta: result.meta });
});

const getCategory = catchAsync(async (req, res) => {
  const data = await service.getCategoryById(req.params.id);
  return successResponse(res, { message: "Category fetched successfully", data });
});

const updateCategory = catchAsync(async (req, res) => {
  const data = await service.updateCategory(req.params.id, req.body);
  return successResponse(res, { message: "Category updated successfully", data });
});

const deleteCategory = catchAsync(async (req, res) => {
  const data = await service.deleteCategory(req.params.id);
  return successResponse(res, { message: "Category deleted successfully", data });
});

module.exports = { createCategory, listCategories, getCategory, updateCategory, deleteCategory };

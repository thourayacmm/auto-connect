const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./pictograms.service");

const createPictogram = catchAsync(async (req, res) => {
  const data = await service.createPictogram(req.body, req.user);
  return successResponse(res, { statusCode: 201, message: "Pictogram created successfully", data });
});

const listPictograms = catchAsync(async (req, res) => {
  const result = await service.listPictograms(req.query);
  return successResponse(res, { message: "Pictograms fetched successfully", data: result.items, meta: result.meta });
});

const getPictogram = catchAsync(async (req, res) => {
  const data = await service.getPictogramById(req.params.id);
  return successResponse(res, { message: "Pictogram fetched successfully", data });
});

const updatePictogram = catchAsync(async (req, res) => {
  const data = await service.updatePictogram(req.params.id, req.body, req.user);
  return successResponse(res, { message: "Pictogram updated successfully", data });
});

const deletePictogram = catchAsync(async (req, res) => {
  const data = await service.deletePictogram(req.params.id);
  return successResponse(res, { message: "Pictogram deleted successfully", data });
});

const searchPictograms = catchAsync(async (req, res) => {
  const data = await service.searchPictograms(req.query.q || req.query.search || "");
  return successResponse(res, { message: "Pictogram search results fetched", data });
});

const listByCategory = catchAsync(async (req, res) => {
  const data = await service.listByCategory(req.params.categoryId);
  return successResponse(res, { message: "Pictograms by category fetched", data });
});

module.exports = {
  createPictogram,
  listPictograms,
  getPictogram,
  updatePictogram,
  deletePictogram,
  searchPictograms,
  listByCategory,
};

const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./scenarios.service");

const createScenario = catchAsync(async (req, res) => {
  const created = await service.createScenario(req.body, req.user);
  const data = await service.getScenarioById(created._id, req.user);
  return successResponse(res, { statusCode: 201, message: "Scenario created successfully", data });
});

const listScenarios = catchAsync(async (req, res) => {
  const result = await service.listScenarios(req.query, req.user);
  return successResponse(res, { message: "Scenarios fetched successfully", data: result.items, meta: result.meta });
});

const getScenario = catchAsync(async (req, res) => {
  const data = await service.getScenarioById(req.params.id, req.user);
  return successResponse(res, { message: "Scenario fetched successfully", data });
});

const updateScenario = catchAsync(async (req, res) => {
  const data = await service.updateScenario(req.params.id, req.body, req.user);
  return successResponse(res, { message: "Scenario updated successfully", data });
});

const deleteScenario = catchAsync(async (req, res) => {
  const data = await service.deleteScenario(req.params.id, req.user);
  return successResponse(res, { message: "Scenario deleted successfully", data });
});

const assignKid = catchAsync(async (req, res) => {
  const data = await service.assignKid(req.params.id, req.body.kidId, req.user);
  return successResponse(res, { message: "Kid assigned to scenario successfully", data });
});

module.exports = { createScenario, listScenarios, getScenario, updateScenario, deleteScenario, assignKid };

const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./analytics.service");

const dashboard = catchAsync(async (req, res) => {
  const data = await service.getDashboardAnalytics(req.user);
  return successResponse(res, { message: "Dashboard analytics fetched", data });
});

const kidAnalytics = catchAsync(async (req, res) => {
  const data = await service.getKidAnalytics(req.params.id, req.user);
  return successResponse(res, { message: "Kid analytics fetched", data });
});

const globalAnalytics = catchAsync(async (_req, res) => {
  const data = await service.getGlobalAnalytics();
  return successResponse(res, { message: "Global analytics fetched", data });
});

module.exports = { dashboard, kidAnalytics, globalAnalytics };

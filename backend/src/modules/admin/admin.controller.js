const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./admin.service");

const overview = catchAsync(async (_req, res) => {
  const data = await service.getOverview();
  return successResponse(res, { message: "Admin overview fetched", data });
});

const statistics = catchAsync(async (_req, res) => {
  const data = await service.getStatistics();
  return successResponse(res, { message: "Admin statistics fetched", data });
});

const audit = catchAsync(async (_req, res) => {
  const data = await service.getAudit();
  return successResponse(res, { message: "Admin audit fetched", data });
});

const accessControl = catchAsync(async (_req, res) => {
  const data = await service.getAccessControl();
  return successResponse(res, { message: "Access control fetched", data });
});

const updateAccessControl = catchAsync(async (req, res) => {
  const data = await service.updateAccessControl(req.body.entries || []);
  return successResponse(res, { message: "Access control updated", data });
});

module.exports = { overview, statistics, audit, accessControl, updateAccessControl };

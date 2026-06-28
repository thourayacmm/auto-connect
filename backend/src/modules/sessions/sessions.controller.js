const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./sessions.service");

const startSession = catchAsync(async (req, res) => {
  const data = await service.startSession(req.body, req.user);
  return successResponse(res, { statusCode: 201, message: "Session started successfully", data });
});

const endSession = catchAsync(async (req, res) => {
  const data = await service.endSession(req.body, req.user);
  return successResponse(res, { message: "Session ended successfully", data });
});

const listSessions = catchAsync(async (req, res) => {
  const result = await service.listSessions(req.query, req.user);
  return successResponse(res, { message: "Sessions fetched successfully", data: result.items, meta: result.meta });
});

const getSession = catchAsync(async (req, res) => {
  const data = await service.getSessionById(req.params.id, req.user);
  return successResponse(res, { message: "Session fetched successfully", data });
});

module.exports = { startSession, endSession, listSessions, getSession };

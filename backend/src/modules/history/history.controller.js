const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./history.service");

const createHistory = catchAsync(async (req, res) => {
  const data = await service.createHistory(req.body, req.user);
  return successResponse(res, { statusCode: 201, message: "Phrase history created successfully", data });
});

const listHistory = catchAsync(async (req, res) => {
  const result = await service.listHistory(req.query, req.user);
  return successResponse(res, { message: "History fetched successfully", data: result.items, meta: result.meta });
});

const getHistoryByKid = catchAsync(async (req, res) => {
  const data = await service.getHistoryByKid(req.params.kidId, req.user);
  return successResponse(res, { message: "Kid history fetched successfully", data });
});

module.exports = { createHistory, listHistory, getHistoryByKid };

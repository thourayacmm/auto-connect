const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./accessRequests.service");

const list = catchAsync(async (req, res) => {
  const data = await service.listAccessRequests(req.query, req.user);
  const counts = await service.getCounts(req.user);
  return successResponse(res, { message: "Access requests fetched", data, meta: { counts } });
});

const create = catchAsync(async (req, res) => {
  const data = await service.createAccessRequest(req.body, req.user);
  return successResponse(res, { statusCode: 201, message: "Access request created", data });
});

const updateStatus = catchAsync(async (req, res) => {
  const data = await service.updateAccessRequestStatus(req.params.id, req.body, req.user);
  return successResponse(res, { message: "Access request status updated", data });
});

module.exports = { create, list, updateStatus };

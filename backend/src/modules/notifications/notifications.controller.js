const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./notifications.service");

const list = catchAsync(async (req, res) => {
  const data = await service.listNotifications(req.user);
  return successResponse(res, { message: "Notifications fetched", data });
});

module.exports = { list };

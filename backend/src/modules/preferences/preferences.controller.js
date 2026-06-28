const { successResponse } = require("../../utils/apiResponse");
const { catchAsync } = require("../../utils/catchAsync");
const service = require("./preferences.service");

const getPreferences = catchAsync(async (req, res) => {
  const data = await service.getPreferences(req.user, req.query.kidId);
  return successResponse(res, { message: "Preferences fetched successfully", data });
});

const updatePreferences = catchAsync(async (req, res) => {
  const data = await service.updatePreferences(req.user, req.body);
  return successResponse(res, { message: "Preferences updated successfully", data });
});

module.exports = { getPreferences, updatePreferences };

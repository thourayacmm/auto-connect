const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./kids.service");

const createKid = catchAsync(async (req, res) => {
  const data = await service.createKid(req.body, req.user);
  return successResponse(res, { statusCode: 201, message: "Kid created successfully", data });
});

const listKids = catchAsync(async (req, res) => {
  const result = await service.listKids(req.query, req.user);
  return successResponse(res, { message: "Kids fetched successfully", data: result.items, meta: result.meta });
});

const getKid = catchAsync(async (req, res) => {
  const data = await service.getKidById(req.params.id, req.user);
  return successResponse(res, { message: "Kid fetched successfully", data });
});

const updateKid = catchAsync(async (req, res) => {
  const data = await service.updateKid(req.params.id, req.body, req.user);
  return successResponse(res, { message: "Kid updated successfully", data });
});

const deleteKid = catchAsync(async (req, res) => {
  const data = await service.deleteKid(req.params.id, req.user);
  return successResponse(res, { message: "Kid deleted successfully", data });
});

const assignParent = catchAsync(async (req, res) => {
  const data = await service.assignParent(req.params.id, req.body.userId, req.user);
  return successResponse(res, { message: "Parent assigned successfully", data });
});

const assignTherapist = catchAsync(async (req, res) => {
  const data = await service.assignTherapist(req.params.id, req.body.userId, req.user);
  return successResponse(res, { message: "Therapist assigned successfully", data });
});

const getKidProgress = catchAsync(async (req, res) => {
  const data = await service.getKidProgress(req.params.id, req.user);
  return successResponse(res, { message: "Kid progress fetched successfully", data });
});

const getKidHistory = catchAsync(async (req, res) => {
  const data = await service.getKidHistory(req.params.id, req.user, req.query);
  return successResponse(res, { message: "Kid history fetched successfully", data });
});

const getKidRecommendations = catchAsync(async (req, res) => {
  const data = await service.getKidRecommendations(req.params.id, req.user);
  return successResponse(res, { message: "Kid recommendations fetched successfully", data });
});

const getKidSessions = catchAsync(async (req, res) => {
  const data = await service.getKidSessions(req.params.id, req.user);
  return successResponse(res, { message: "Kid sessions fetched successfully", data });
});

module.exports = {
  createKid,
  listKids,
  getKid,
  updateKid,
  deleteKid,
  assignParent,
  assignTherapist,
  getKidProgress,
  getKidHistory,
  getKidRecommendations,
  getKidSessions,
};

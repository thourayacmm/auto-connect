const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const service = require("./user.service");

const listUsers = catchAsync(async (req, res) => {
  const result = await service.listUsers(req.query, req.user);
  return successResponse(res, {
    message: "Users fetched successfully",
    data: result.items,
    meta: result.meta,
  });
});

const getUser = catchAsync(async (req, res) => {
  const data = await service.getUserById(req.params.id, req.user);
  return successResponse(res, { message: "User fetched successfully", data });
});

const createUser = catchAsync(async (req, res) => {
  const data = await service.createUser(req.body, req.user);
  return successResponse(res, { statusCode: 201, message: "User created successfully", data });
});

const updateUser = catchAsync(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.body, req.user);
  return successResponse(res, { message: "User updated successfully", data });
});

const updateStatus = catchAsync(async (req, res) => {
  const data = await service.updateUserStatus(req.params.id, req.body.isActive, req.user);
  return successResponse(res, { message: "User status updated successfully", data });
});

const deleteUser = catchAsync(async (req, res) => {
  const data = await service.deleteUser(req.params.id, req.user);
  return successResponse(res, { message: "User deleted successfully", data });
});

module.exports = { listUsers, getUser, createUser, updateUser, updateStatus, deleteUser };

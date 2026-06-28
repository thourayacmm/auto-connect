const env = require("../../config/env");
const { catchAsync } = require("../../utils/catchAsync");
const { successResponse } = require("../../utils/apiResponse");
const authService = require("./auth.service");

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: env.jwtCookieExpiresDays * 24 * 60 * 60 * 1000,
};

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  res.cookie("token", result.token, cookieOptions);
  return successResponse(res, {
    statusCode: 201,
    message: "User registered successfully",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  res.cookie("token", result.token, cookieOptions);
  return successResponse(res, {
    message: "Login successful",
    data: result,
  });
});

const childSession = catchAsync(async (req, res) => {
  const result = await authService.childSessionLogin(req.body);
  res.cookie("token", result.token, cookieOptions);
  return successResponse(res, {
    message: "Child session started successfully",
    data: result,
  });
});

const me = catchAsync(async (req, res) =>
  successResponse(res, {
    message: "Current profile fetched",
    data: req.user,
  }),
);

const logout = catchAsync(async (_req, res) => {
  res.clearCookie("token", cookieOptions);
  return successResponse(res, { message: "Logout successful", data: null });
});

module.exports = { register, login, childSession, me, logout };

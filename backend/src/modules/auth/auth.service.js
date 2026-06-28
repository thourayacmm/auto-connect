const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../../config/env");
const { User } = require("../users/user.model");
const { Kid } = require("../kids/kid.model");
const { ROLES } = require("../../constants/roles");
const { ApiError } = require("../../utils/ApiError");

const createToken = (user) =>
  jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

const createChildToken = (kid) =>
  jwt.sign(
    {
      sub: String(kid._id),
      role: ROLES.CHILD,
      kidId: String(kid._id),
      sessionType: "kid",
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
};

const sanitizeKidSession = (kid) => ({
  id: String(kid._id),
  kidId: String(kid._id),
  firstName: kid.firstName,
  lastName: kid.lastName,
  fullName: `${kid.firstName} ${kid.lastName}`.trim(),
  age: kid.age,
  role: ROLES.CHILD,
  permissions: [],
  active: kid.status === "active",
  currentLevel: kid.currentLevel,
  communicationLevel: kid.communicationLevel,
  difficultyType: kid.difficultyType,
  sessionAccessCode: kid.sessionAccessCode,
  trackingPreferences: kid.trackingPreferences || {},
});

const register = async (payload) => {
  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email.toLowerCase(),
    passwordHash,
    role: payload.role,
    language: payload.language || "fr",
    phone: payload.phone || null,
  });

  const token = createToken(user);
  return { token, user: sanitizeUser(user) };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = createToken(user);
  return { token, user: sanitizeUser(user) };
};

const childSessionLogin = async ({ accessCode }) => {
  const normalizedCode = String(accessCode || "").trim().toUpperCase();
  const kid = await Kid.findOne({ sessionAccessCode: normalizedCode });

  if (!kid || kid.status !== "active") {
    throw new ApiError(401, "Invalid child access code");
  }

  const token = createChildToken(kid);
  return { token, user: sanitizeKidSession(kid) };
};

module.exports = { register, login, childSessionLogin, sanitizeUser, sanitizeKidSession };

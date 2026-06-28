const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { ApiError } = require("../utils/ApiError");
const { User } = require("../modules/users/user.model");
const { Kid } = require("../modules/kids/kid.model");
const { ROLES } = require("../constants/roles");

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return req.cookies?.token || null;
};

const resolveUserFromToken = async (token) => {
  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (payload.role === ROLES.CHILD && payload.sessionType === "kid") {
      const kid = await Kid.findById(payload.kidId || payload.sub).select(
        "firstName lastName age currentLevel communicationLevel difficultyType sessionAccessCode trackingPreferences status",
      );

      if (!kid || kid.status !== "active") {
        throw new ApiError(401, "Invalid child session");
      }

      return {
        _id: kid._id,
        kidId: kid._id,
        role: ROLES.CHILD,
        firstName: kid.firstName,
        lastName: kid.lastName,
        fullName: `${kid.firstName} ${kid.lastName}`.trim(),
        age: kid.age,
        currentLevel: kid.currentLevel,
        communicationLevel: kid.communicationLevel,
        difficultyType: kid.difficultyType,
        sessionAccessCode: kid.sessionAccessCode,
        trackingPreferences: kid.trackingPreferences || {},
        isActive: true,
      };
    }

    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid session");
    }
    return user;
  } catch (_error) {
    throw new ApiError(401, "Invalid or expired token");
  }
};

const protect = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    req.user = await resolveUserFromToken(token);
    return next();
  } catch (error) {
    return next(error);
  }
};

const optionalProtect = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    req.user = await resolveUserFromToken(token);
  } catch (_error) {
    req.user = null;
  }
  return next();
};

module.exports = { protect, optionalProtect };

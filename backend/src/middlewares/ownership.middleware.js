const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");
const { Kid } = require("../modules/kids/kid.model");
const { User } = require("../modules/users/user.model");
const { ApiError } = require("../utils/ApiError");

const canAccessKid = async (kidId, user) => {
  if (!mongoose.isValidObjectId(kidId)) return false;
  if (!user) return false;
  if (user.role === ROLES.ADMIN) return true;

  const kid = await Kid.findById(kidId).select("assignedParents assignedTherapists");
  if (!kid) return false;

  const uid = String(user._id);
  if (user.role === ROLES.CHILD) {
    return String(kidId) === String(user.kidId || user._id);
  }
  if (user.role === ROLES.PARENT) {
    return kid.assignedParents.some((id) => String(id) === uid);
  }
  if (user.role === ROLES.THERAPIST) {
    if (kid.assignedTherapists.some((id) => String(id) === uid)) return true;
    const parentIds = kid.assignedParents.map((id) => String(id));
    if (!parentIds.length) return false;
    const createdParent = await User.exists({
      _id: { $in: parentIds },
      role: ROLES.PARENT,
      createdBy: user._id,
    });
    return Boolean(createdParent);
  }
  return false;
};

const requireKidAccess = (kidIdResolver = (req) => req.params.id) => async (req, _res, next) => {
  const kidId = kidIdResolver(req);
  const allowed = await canAccessKid(kidId, req.user);
  if (!allowed) {
    return next(new ApiError(403, "Unauthorized access to kid resource"));
  }
  return next();
};

module.exports = { canAccessKid, requireKidAccess };

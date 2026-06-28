const bcrypt = require("bcryptjs");
const { User } = require("./user.model");
const { Kid } = require("../kids/kid.model");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");
const { ROLES } = require("../../constants/roles");

const sanitize = (u) => {
  const obj = u.toObject ? u.toObject() : { ...u };
  delete obj.passwordHash;
  return obj;
};

const formatKidSummary = (kid) => ({
  id: String(kid._id),
  _id: String(kid._id),
  name: `${kid.firstName || ""} ${kid.lastName || ""}`.trim(),
  firstName: kid.firstName,
  lastName: kid.lastName,
  age: kid.age,
  level: kid.currentLevel || kid.communicationLevel,
  currentLevel: kid.currentLevel,
  parentId: kid.assignedParents?.[0] ? String(kid.assignedParents[0]) : "",
  therapistIds: (kid.assignedTherapists || []).map((therapistId) => String(therapistId)),
  status: kid.status,
});

const getFollowedParentIds = async (therapistId) => {
  const followedKids = await Kid.find({ assignedTherapists: therapistId }).select("assignedParents");
  return followedKids.flatMap((kid) => kid.assignedParents || []);
};

const buildTherapistParentScope = async (therapistId) => {
  const parentIds = await getFollowedParentIds(therapistId);
  return {
    role: ROLES.PARENT,
    $or: [
      { createdBy: therapistId },
      { _id: { $in: parentIds } },
    ],
  };
};

const buildUserScope = async (query, actor) => {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (typeof query.isActive === "boolean") filter.isActive = query.isActive;

  if (actor?.role === ROLES.THERAPIST) {
    Object.assign(filter, await buildTherapistParentScope(actor._id));
  }

  return filter;
};

const listUsers = async (query, actor) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = await buildUserScope(query, actor);

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const sanitizedItems = items.map(sanitize);

  if (filter.role === ROLES.PARENT && sanitizedItems.length) {
    const parentIds = sanitizedItems.map((parent) => parent._id);
    const kids = await Kid.find({ assignedParents: { $in: parentIds } })
      .select("firstName lastName age currentLevel communicationLevel assignedParents assignedTherapists status")
      .sort({ createdAt: -1 });
    const childrenByParentId = kids.reduce((acc, kid) => {
      (kid.assignedParents || []).forEach((parentId) => {
        const key = String(parentId);
        const existingChildren = acc[key] || [];
        const kidSummary = formatKidSummary(kid);
        const duplicateName = existingChildren.some(
          (child) => child.name.trim().toLowerCase() === kidSummary.name.trim().toLowerCase(),
        );
        acc[key] = duplicateName ? existingChildren : [...existingChildren, kidSummary];
      });
      return acc;
    }, {});

    sanitizedItems.forEach((parent) => {
      parent.children = childrenByParentId[String(parent._id)] || [];
      parent.childrenCount = parent.children.length;
    });
  }

  return {
    items: sanitizedItems,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getUserById = async (id, actor) => {
  const filter = { _id: id };
  if (actor?.role === ROLES.THERAPIST) {
    Object.assign(filter, await buildTherapistParentScope(actor._id));
  }
  const user = await User.findOne(filter);
  if (!user) throw new ApiError(404, "User not found");
  return sanitize(user);
};

const createUser = async (payload, actor) => {
  if (actor?.role === ROLES.THERAPIST && payload.role !== ROLES.PARENT) {
    throw new ApiError(403, "Therapists can only create parent accounts");
  }

  const existing = await User.findOne({ email: payload.email.toLowerCase() });
  if (existing) throw new ApiError(409, "Email already in use");
  const passwordHash = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    ...payload,
    email: payload.email.toLowerCase(),
    passwordHash,
    createdBy: actor?._id || null,
  });
  return sanitize(user);
};

const updateUser = async (id, payload, actor) => {
  const filter = { _id: id };
  if (actor?.role === ROLES.THERAPIST) {
    Object.assign(filter, await buildTherapistParentScope(actor._id));
  }
  const user = await User.findOne(filter);
  if (!user) throw new ApiError(404, "User not found");

  if (payload.email && payload.email.toLowerCase() !== user.email) {
    const exists = await User.findOne({ email: payload.email.toLowerCase(), _id: { $ne: id } });
    if (exists) throw new ApiError(409, "Email already in use");
    user.email = payload.email.toLowerCase();
  }

  Object.assign(user, payload);
  await user.save();
  return sanitize(user);
};

const updateUserStatus = async (id, isActive, actor) => {
  const filter = { _id: id };
  if (actor?.role === ROLES.THERAPIST) {
    Object.assign(filter, await buildTherapistParentScope(actor._id));
  }
  const user = await User.findOneAndUpdate(filter, { isActive }, { new: true });
  if (!user) throw new ApiError(404, "User not found");
  return sanitize(user);
};

const deleteUser = async (id, actor) => {
  const filter = { _id: id };
  if (actor?.role === ROLES.THERAPIST) {
    Object.assign(filter, await buildTherapistParentScope(actor._id));
  }
  const user = await User.findOneAndDelete(filter);
  if (!user) throw new ApiError(404, "User not found");
  return { id };
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
};

const { Scenario } = require("./scenario.model");
const { ROLES } = require("../../constants/roles");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");
const { Kid } = require("../kids/kid.model");
const { User } = require("../users/user.model");
const { canAccessKid } = require("../../middlewares/ownership.middleware");

const populate = [
  { path: "category", select: "name color" },
  { path: "pictogramSequence", select: "name imageUrl level" },
  { path: "assignedKids", select: "firstName lastName currentLevel" },
  { path: "createdBy", select: "firstName lastName email role" },
];

const ensureAssignedKidsAccess = async (assignedKids = [], user) => {
  if (!assignedKids?.length) return;
  const checks = await Promise.all(assignedKids.map((kidId) => canAccessKid(kidId, user)));
  if (checks.some((allowed) => !allowed)) {
    throw new ApiError(403, "Unauthorized scenario assignment");
  }
};

const levelRank = (level = "") => {
  const normalized = String(level).toLowerCase();
  if (normalized.includes("3") || normalized.includes("avanc")) return 3;
  if (normalized.includes("2") || normalized.includes("inter")) return 2;
  return 1;
};

const kidLevelRank = (kid) =>
  Math.max(
    levelRank(kid.trackingPreferences?.childLevel),
    levelRank(kid.currentLevel),
    levelRank(kid.communicationLevel),
  );

const buildAssignableKidFilter = async (user) => {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.THERAPIST) {
    const createdParents = await User.find({ role: ROLES.PARENT, createdBy: user._id }).select("_id");
    return {
      $or: [
        { assignedTherapists: user._id },
        { assignedParents: { $in: createdParents.map((parent) => parent._id) } },
      ],
    };
  }
  return { _id: null };
};

const resolveScenarioAssignedKids = async (payload, user) => {
  if (payload.assignedKids?.length) {
    await ensureAssignedKidsAccess(payload.assignedKids, user);
    return payload.assignedKids;
  }

  const filter = await buildAssignableKidFilter(user);
  const kids = await Kid.find({ ...filter, status: "active" }).select("_id age currentLevel communicationLevel trackingPreferences");
  const targetRank = levelRank(payload.targetLevel);
  const ageMin = payload.ageMin ?? 2;
  const ageMax = payload.ageMax ?? 25;

  return kids
    .filter((kid) => {
      return kid.age >= ageMin && kid.age <= ageMax && kidLevelRank(kid) >= targetRank;
    })
    .map((kid) => kid._id);
};

const createScenario = async (payload, user) => {
  const assignedKids = await resolveScenarioAssignedKids(payload, user);
  const created = await Scenario.create({
    ...payload,
    assignedKids,
    createdBy: user._id,
  });
  return Scenario.findById(created._id).populate(populate);
};

const listScenarios = async (query, user) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = {};

  if (query.targetLevel) filter.targetLevel = query.targetLevel;
  if (typeof query.isActive === "boolean") filter.isActive = query.isActive;
  if (query.kidId) filter.assignedKids = query.kidId;
  if (query.age) {
    filter.ageMin = { $lte: query.age };
    filter.ageMax = { $gte: query.age };
  }
  if (user.role === ROLES.THERAPIST) filter.createdBy = user._id;
  if (user.role === ROLES.CHILD) {
    const kidId = user.kidId || user._id;
    filter.assignedKids = kidId;
    filter.isActive = true;
    const kid = await Kid.findById(kidId).select("age");
    if (kid?.age) {
      filter.ageMin = { $lte: kid.age };
      filter.ageMax = { $gte: kid.age };
    }
  }
  if (user.role === ROLES.PARENT) {
    const kids = await Kid.find({ assignedParents: user._id }).select("_id");
    filter.assignedKids = { $in: kids.map((k) => k._id) };
  }

  const [items, total] = await Promise.all([
    Scenario.find(filter).populate(populate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Scenario.countDocuments(filter),
  ]);

  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const getScenarioById = async (id, user) => {
  const filter = { _id: id };
  if (user.role === ROLES.THERAPIST) filter.createdBy = user._id;
  if (user.role === ROLES.CHILD) filter.assignedKids = user.kidId || user._id;
  if (user.role === ROLES.PARENT) {
    const kids = await Kid.find({ assignedParents: user._id }).select("_id");
    filter.assignedKids = { $in: kids.map((k) => k._id) };
  }
  const scenario = await Scenario.findOne(filter).populate(populate);
  if (!scenario) throw new ApiError(404, "Scenario not found");
  return scenario;
};

const updateScenario = async (id, payload, user) => {
  const filter = { _id: id };
  if (user.role === ROLES.THERAPIST) filter.createdBy = user._id;
  if (user.role === ROLES.PARENT) throw new ApiError(403, "Parent cannot update scenarios");
  await ensureAssignedKidsAccess(payload.assignedKids, user);
  const scenario = await Scenario.findOneAndUpdate(filter, payload, { new: true }).populate(populate);
  if (!scenario) throw new ApiError(404, "Scenario not found");
  return scenario;
};

const deleteScenario = async (id, user) => {
  const filter = { _id: id };
  if (user.role === ROLES.THERAPIST) filter.createdBy = user._id;
  if (user.role === ROLES.PARENT) throw new ApiError(403, "Parent cannot delete scenarios");
  const scenario = await Scenario.findOneAndDelete(filter);
  if (!scenario) throw new ApiError(404, "Scenario not found");
  return { id };
};

const assignKid = async (id, kidId, user) => {
  const filter = { _id: id };
  if (user.role === ROLES.THERAPIST) filter.createdBy = user._id;
  if (user.role === ROLES.PARENT) throw new ApiError(403, "Parent cannot assign scenarios");
  const allowed = await canAccessKid(kidId, user);
  if (!allowed) throw new ApiError(403, "Unauthorized scenario assignment");
  const scenario = await Scenario.findOneAndUpdate(filter, { $addToSet: { assignedKids: kidId } }, { new: true }).populate(populate);
  if (!scenario) throw new ApiError(404, "Scenario not found");
  return scenario;
};

module.exports = { createScenario, listScenarios, getScenarioById, updateScenario, deleteScenario, assignKid };

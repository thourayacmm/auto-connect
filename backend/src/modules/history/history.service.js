const { PhraseHistory } = require("./phraseHistory.model");
const { ScoreHistory } = require("../scores/scoreHistory.model");
const { ROLES } = require("../../constants/roles");
const { canAccessKid } = require("../../middlewares/ownership.middleware");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");

const ensureKidAccess = async (kidId, user) => {
  const allowed = await canAccessKid(kidId, user);
  if (!allowed) throw new ApiError(403, "Unauthorized access to kid history");
};

const createHistory = async (payload, user) => {
  await ensureKidAccess(payload.kid, user);
  const history = await PhraseHistory.create({
    ...payload,
    usedAt: payload.usedAt ? new Date(payload.usedAt) : new Date(),
    createdBy: user.role === ROLES.CHILD ? null : user._id,
  });

  if (typeof payload.score === "number" && Number.isFinite(payload.score)) {
    await ScoreHistory.create({
      kid: payload.kid,
      scoreType: "phrase",
      value: payload.score,
      explanation: "Score issu de l'historique des phrases.",
      basedOn: { phraseHistory: history._id },
      createdBy: user.role === ROLES.CHILD ? "system" : "therapist",
    });
  }

  return history;
};

const buildFilterByRole = async (query, user) => {
  const filter = {};
  if (query.kid) {
    await ensureKidAccess(query.kid, user);
    filter.kid = query.kid;
  } else if (user.role === ROLES.CHILD) {
    filter.kid = user.kidId || user._id;
  } else if (user.role !== ROLES.ADMIN) {
    throw new ApiError(400, "kid query param is required for parent/therapist");
  }

  if (query.source) filter.source = query.source;
  if (query.scoreMin !== undefined || query.scoreMax !== undefined) {
    filter.score = {};
    if (query.scoreMin !== undefined) filter.score.$gte = query.scoreMin;
    if (query.scoreMax !== undefined) filter.score.$lte = query.scoreMax;
  }
  if (query.from || query.to) {
    filter.usedAt = {};
    if (query.from) filter.usedAt.$gte = new Date(query.from);
    if (query.to) filter.usedAt.$lte = new Date(query.to);
  }

  return filter;
};

const listHistory = async (query, user) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = await buildFilterByRole(query, user);
  const [items, total] = await Promise.all([
    PhraseHistory.find(filter)
      .populate("kid", "firstName lastName")
      .populate("pictograms", "name imageUrl")
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(limit),
    PhraseHistory.countDocuments(filter),
  ]);
  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const getHistoryByKid = async (kidId, user) => {
  await ensureKidAccess(kidId, user);
  return PhraseHistory.find({ kid: kidId }).populate("pictograms", "name imageUrl").sort({ usedAt: -1 }).limit(200);
};

module.exports = { createHistory, listHistory, getHistoryByKid };

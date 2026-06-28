const mongoose = require("mongoose");
const { Session } = require("./session.model");
const { ROLES } = require("../../constants/roles");
const { canAccessKid } = require("../../middlewares/ownership.middleware");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");

const ensureKidAccess = async (kidId, user) => {
  const allowed = await canAccessKid(kidId, user);
  if (!allowed) throw new ApiError(403, "Unauthorized access to kid sessions");
};

const startSession = async (payload, user) => {
  await ensureKidAccess(payload.kid, user);
  return Session.create({
    kid: payload.kid,
    startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(),
    scenario: payload.scenario || null,
    actions: (payload.actions || []).map((a) => ({
      ...a,
      at: a.at ? new Date(a.at) : new Date(),
    })),
    createdBy: user.role === ROLES.CHILD ? null : user._id,
  });
};

const endSession = async (payload, user) => {
  const session = await Session.findById(payload.sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  await ensureKidAccess(session.kid, user);

  const endedAt = payload.endedAt ? new Date(payload.endedAt) : new Date();
  session.endedAt = endedAt;
  session.duration = Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));
  if (payload.actions?.length) {
    session.actions.push(
      ...payload.actions.map((a) => ({
        ...a,
        at: a.at ? new Date(a.at) : new Date(),
      })),
    );
  }
  if (payload.score !== undefined) session.score = payload.score;
  if (payload.aiSummary) session.aiSummary = payload.aiSummary;
  if (payload.recommendationsSnapshot) session.recommendationsSnapshot = payload.recommendationsSnapshot;
  await session.save();

  return Session.findById(session._id).populate("kid", "firstName lastName").populate("scenario", "title");
};

const listSessions = async (query, user) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = {};

  if (query.kid) {
    await ensureKidAccess(query.kid, user);
    filter.kid = new mongoose.Types.ObjectId(query.kid);
  } else if (user.role === ROLES.CHILD) {
    filter.kid = new mongoose.Types.ObjectId(user.kidId || user._id);
  } else if (user.role !== ROLES.ADMIN) {
    throw new ApiError(400, "kid query param is required for parent/therapist");
  }

  if (query.from || query.to) {
    filter.startedAt = {};
    if (query.from) filter.startedAt.$gte = new Date(query.from);
    if (query.to) filter.startedAt.$lte = new Date(query.to);
  }

  const [items, total] = await Promise.all([
    Session.find(filter).populate("kid", "firstName lastName").populate("scenario", "title").sort({ startedAt: -1 }).skip(skip).limit(limit),
    Session.countDocuments(filter),
  ]);

  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

const getSessionById = async (id, user) => {
  const session = await Session.findById(id).populate("kid", "firstName lastName").populate("scenario", "title");
  if (!session) throw new ApiError(404, "Session not found");
  await ensureKidAccess(session.kid._id || session.kid, user);
  return session;
};

module.exports = { startSession, endSession, listSessions, getSessionById };

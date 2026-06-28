const mongoose = require("mongoose");
const { Kid } = require("./kid.model");
const { PhraseHistory } = require("../history/phraseHistory.model");
const { Session } = require("../sessions/session.model");
const { Recommendation } = require("../recommendations/recommendation.model");
const { ScoreHistory } = require("../scores/scoreHistory.model");
const { User } = require("../users/user.model");
const { Scenario } = require("../scenarios/scenario.model");
const { ROLES } = require("../../constants/roles");
const { ApiError } = require("../../utils/ApiError");
const { parsePaginationQuery } = require("../../utils/pagination");

const kidPopulate = [
  { path: "assignedParents", select: "firstName lastName email role" },
  { path: "assignedTherapists", select: "firstName lastName email role" },
  { path: "createdBy", select: "firstName lastName email role" },
];

const generateSessionAccessCode = () => `KID-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const getParentIdsInTherapistScope = async (therapistId) => {
  const [createdParents, followedKids] = await Promise.all([
    User.find({ role: ROLES.PARENT, createdBy: therapistId }).select("_id"),
    Kid.find({ assignedTherapists: therapistId }).select("assignedParents"),
  ]);

  return [
    ...createdParents.map((parent) => parent._id),
    ...followedKids.flatMap((kid) => kid.assignedParents || []),
  ];
};

const buildOwnershipFilter = async (user) => {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.CHILD) return { _id: user.kidId || user._id };
  if (user.role === ROLES.PARENT) return { assignedParents: user._id };
  if (user.role === ROLES.THERAPIST) {
    const parentIds = await getParentIdsInTherapistScope(user._id);
    return {
      $or: [
        { assignedTherapists: user._id },
        { assignedParents: { $in: parentIds } },
      ],
    };
  }
  return { _id: null };
};

const listKids = async (query, user) => {
  const { page, limit, skip } = parsePaginationQuery(query);
  const filter = await buildOwnershipFilter(user);

  if (query.status) filter.status = query.status;
  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: "i" } },
      { lastName: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    Kid.find(filter).populate(kidPopulate).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Kid.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

const getKidById = async (id, user) => {
  const ownershipFilter = await buildOwnershipFilter(user);
  const filter = { _id: id, ...ownershipFilter };
  const kid = await Kid.findOne(filter).populate(kidPopulate);
  if (!kid) throw new ApiError(404, "Kid not found");
  return kid;
};

const createKid = async (payload, user) => {
  const sessionAccessCode = payload.sessionAccessCode ? String(payload.sessionAccessCode).trim().toUpperCase() : generateSessionAccessCode();

  const existingByCode = await Kid.findOne({ sessionAccessCode }).select("_id");
  if (existingByCode) {
    throw new ApiError(409, "Kid session access code already exists");
  }

  const kidData = {
    ...payload,
    sessionAccessCode,
    createdBy: user._id,
    assignedParents: [],
    assignedTherapists: [],
  };

  if (user.role === ROLES.PARENT) {
    kidData.assignedParents = [user._id];
    const parent = await User.findById(user._id).select("createdBy");
    const siblingKids = await Kid.find({ assignedParents: user._id }).select("assignedTherapists");
    const inheritedTherapists = siblingKids.flatMap((kid) => kid.assignedTherapists || []);
    kidData.assignedTherapists = [...new Set([
      ...(parent?.createdBy ? [String(parent.createdBy)] : []),
      ...inheritedTherapists.map((therapistId) => String(therapistId)),
    ])].map((therapistId) => new mongoose.Types.ObjectId(therapistId));
  }
  if (user.role === ROLES.THERAPIST) kidData.assignedTherapists = [user._id];

  const kid = await Kid.create(kidData);
  return Kid.findById(kid._id).populate(kidPopulate);
};

const updateKid = async (id, payload, user) => {
  const ownershipFilter = await buildOwnershipFilter(user);
  const kid = await Kid.findOne({ _id: id, ...ownershipFilter });
  if (!kid) throw new ApiError(404, "Kid not found");

  if (payload.sessionAccessCode) {
    const normalizedCode = String(payload.sessionAccessCode).trim().toUpperCase();
    const existingByCode = await Kid.findOne({ sessionAccessCode: normalizedCode, _id: { $ne: id } }).select("_id");
    if (existingByCode) {
      throw new ApiError(409, "Kid session access code already exists");
    }
    payload.sessionAccessCode = normalizedCode;
  }

  Object.assign(kid, payload);
  await kid.save();
  return Kid.findById(kid._id).populate(kidPopulate);
};

const deleteKid = async (id, user) => {
  const ownershipFilter = await buildOwnershipFilter(user);
  const filter = { _id: id, ...ownershipFilter };
  const deleted = await Kid.findOneAndDelete(filter);
  if (!deleted) throw new ApiError(404, "Kid not found");
  return { id };
};

const assignParent = async (id, userId, user) => {
  if (![ROLES.ADMIN, ROLES.THERAPIST].includes(user.role)) {
    throw new ApiError(403, "Only admin or therapist can assign parent");
  }
  const parentUser = await User.findById(userId).select("role isActive");
  if (!parentUser || !parentUser.isActive || parentUser.role !== ROLES.PARENT) {
    throw new ApiError(400, "Invalid parent user");
  }
  const kid = await Kid.findByIdAndUpdate(
    id,
    { $addToSet: { assignedParents: new mongoose.Types.ObjectId(userId) } },
    { new: true },
  ).populate(kidPopulate);
  if (!kid) throw new ApiError(404, "Kid not found");
  return kid;
};

const assignTherapist = async (id, userId, user) => {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can assign therapist");
  }
  const therapistUser = await User.findById(userId).select("role isActive");
  if (!therapistUser || !therapistUser.isActive || therapistUser.role !== ROLES.THERAPIST) {
    throw new ApiError(400, "Invalid therapist user");
  }
  const kid = await Kid.findByIdAndUpdate(
    id,
    { $addToSet: { assignedTherapists: new mongoose.Types.ObjectId(userId) } },
    { new: true },
  ).populate(kidPopulate);
  if (!kid) throw new ApiError(404, "Kid not found");
  return kid;
};

const getKidHistory = async (kidId, user, query = {}) => {
  await getKidById(kidId, user);
  const filter = { kid: kidId };
  if (query.source) filter.source = query.source;
  return PhraseHistory.find(filter).populate("pictograms", "name imageUrl").sort({ usedAt: -1 }).limit(200);
};

const getKidRecommendations = async (kidId, user) => {
  await getKidById(kidId, user);
  return Recommendation.find({ kid: kidId }).sort({ createdAt: -1 }).limit(100);
};

const getKidSessions = async (kidId, user) => {
  await getKidById(kidId, user);
  return Session.find({ kid: kidId }).populate("scenario", "title").sort({ startedAt: -1 }).limit(100);
};

const getKidProgress = async (kidId, user) => {
  await getKidById(kidId, user);

  const [
    scoreEvolution,
    sessionStats,
    scoredSessions,
    topPictograms,
    topScenarios,
    recentHistory,
    recentRecs,
    assignedScenarios,
    historyCount,
    scenarioHistoryCount,
  ] = await Promise.all([
    ScoreHistory.find({ kid: kidId }).sort({ createdAt: -1 }).limit(20),
    Session.aggregate([
      { $match: { kid: new mongoose.Types.ObjectId(kidId) } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: "$duration" },
        },
      },
    ]),
    Session.find({ kid: kidId, score: { $type: "number" } }).sort({ endedAt: -1, startedAt: -1 }).limit(20),
    PhraseHistory.aggregate([
      { $match: { kid: new mongoose.Types.ObjectId(kidId) } },
      { $unwind: "$pictograms" },
      { $group: { _id: "$pictograms", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: "pictograms", localField: "_id", foreignField: "_id", as: "pictogram" } },
      { $unwind: { path: "$pictogram", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, name: "$pictogram.name", imageUrl: "$pictogram.imageUrl" } },
    ]),
    Session.aggregate([
      { $match: { kid: new mongoose.Types.ObjectId(kidId), scenario: { $ne: null } } },
      { $group: { _id: "$scenario", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: "scenarios", localField: "_id", foreignField: "_id", as: "scenario" } },
      { $unwind: { path: "$scenario", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, title: "$scenario.title" } },
    ]),
    PhraseHistory.find({ kid: kidId }).sort({ usedAt: -1 }).limit(10),
    Recommendation.find({ kid: kidId }).sort({ createdAt: -1 }).limit(10),
    Scenario.find({ assignedKids: kidId, isActive: true })
      .select("title description targetLevel ageMin ageMax estimatedDuration createdAt")
      .sort({ createdAt: -1 })
      .limit(20),
    PhraseHistory.countDocuments({ kid: kidId }),
    PhraseHistory.countDocuments({ kid: kidId, source: "scenario" }),
  ]);

  const numericScores = [
    ...scoreEvolution.map((item) => item.value),
    ...scoredSessions.map((item) => item.score),
    ...recentHistory.map((item) => item.score),
  ]
    .map(Number)
    .filter((value) => Number.isFinite(value));

  const meaningfulScores = numericScores.filter((value) => value > 0);
  const latestScore = meaningfulScores.length
    ? Math.round(meaningfulScores[0])
    : numericScores.length
      ? Math.round(numericScores[0])
      : null;
  const averageScore = meaningfulScores.length
    ? Math.round(meaningfulScores.reduce((sum, value) => sum + value, 0) / meaningfulScores.length)
    : numericScores.length
      ? Math.round(numericScores.reduce((sum, value) => sum + value, 0) / numericScores.length)
      : null;
  const levelFromScore = latestScore >= 80 ? "Avance" : latestScore >= 60 ? "Intermediaire" : "Debutant";
  const completedScenariosCount = topScenarios.reduce((sum, item) => sum + (item.count || 0), 0);
  const totalSessions = sessionStats[0]?.totalSessions || 0;
  const activityCount = Math.max(totalSessions, historyCount);

  return {
    kidId,
    currentScore: latestScore ?? averageScore,
    averageScore,
    currentLevel: levelFromScore,
    scoreEvolution,
    totalSessions,
    historyCount,
    activityCount,
    averageSessionDuration: Number((sessionStats[0]?.avgDuration || 0).toFixed(2)),
    topPictograms,
    topScenarios,
    completedScenariosCount: Math.max(completedScenariosCount, scenarioHistoryCount),
    assignedScenarios,
    assignedScenarioCount: assignedScenarios.length,
    recentHistory,
    recentRecommendations: recentRecs,
  };
};

module.exports = {
  listKids,
  getKidById,
  createKid,
  updateKid,
  deleteKid,
  assignParent,
  assignTherapist,
  getKidProgress,
  getKidHistory,
  getKidRecommendations,
  getKidSessions,
};

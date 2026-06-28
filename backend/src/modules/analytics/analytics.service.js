const mongoose = require("mongoose");
const { User } = require("../users/user.model");
const { Kid } = require("../kids/kid.model");
const { Pictogram } = require("../pictograms/pictogram.model");
const { Category } = require("../categories/category.model");
const { Scenario } = require("../scenarios/scenario.model");
const { PhraseHistory } = require("../history/phraseHistory.model");
const { Session } = require("../sessions/session.model");
const { Recommendation } = require("../recommendations/recommendation.model");
const { ScoreHistory } = require("../scores/scoreHistory.model");
const { ROLES } = require("../../constants/roles");
const { ApiError } = require("../../utils/ApiError");
const { canAccessKid } = require("../../middlewares/ownership.middleware");

const buildRecentDaySeries = (sessions = [], dayCount = 7) => {
  const formatter = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
  const today = new Date();

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(today.getDate() - (dayCount - 1 - index));
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const value = sessions.filter((session) => {
      const startedAt = new Date(session.startedAt);
      return startedAt >= date && startedAt < nextDate;
    }).length;

    return {
      label: formatter.format(date),
      value,
    };
  });
};

const buildRecentWeekSeries = (sessions = [], weekCount = 4) =>
  Array.from({ length: weekCount }, (_, index) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    end.setDate(end.getDate() - index * 7);

    const start = new Date(end);
    start.setHours(0, 0, 0, 0);
    start.setDate(end.getDate() - 6);

    const value = sessions.filter((session) => {
      const startedAt = new Date(session.startedAt);
      return startedAt >= start && startedAt <= end;
    }).length;

    return {
      label: `S${weekCount - index}`,
      value,
    };
  }).reverse();

const getKidAnalytics = async (kidId, user) => {
  const allowed = await canAccessKid(kidId, user);
  if (!allowed) throw new ApiError(403, "Unauthorized access to kid analytics");

  const [scores, sessions, topPictograms, topScenarios, recentHistory, recommendations] = await Promise.all([
    ScoreHistory.find({ kid: kidId }).sort({ createdAt: -1 }).limit(30),
    Session.find({ kid: kidId }).sort({ startedAt: -1 }).limit(30),
    PhraseHistory.aggregate([
      { $match: { kid: new mongoose.Types.ObjectId(kidId) } },
      { $unwind: "$pictograms" },
      { $group: { _id: "$pictograms", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Session.aggregate([
      { $match: { kid: new mongoose.Types.ObjectId(kidId), scenario: { $ne: null } } },
      { $group: { _id: "$scenario", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    PhraseHistory.find({ kid: kidId }).sort({ usedAt: -1 }).limit(10),
    Recommendation.find({ kid: kidId }).sort({ createdAt: -1 }).limit(10),
  ]);

  const currentScore = scores[0]?.value ?? null;
  const avgDuration =
    sessions.length > 0
      ? Number((sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length).toFixed(2))
      : 0;

  return {
    kidId,
    currentScore,
    sessionCount: sessions.length,
    averageSessionDuration: avgDuration,
    scoreEvolution: scores,
    topPictograms,
    topScenarios,
    recentHistory,
    recentRecommendations: recommendations,
  };
};

const getDashboardAnalytics = async (user) => {
  if (user.role === ROLES.ADMIN) {
    return getGlobalAnalytics();
  }

  let kidFilter = user.role === ROLES.PARENT ? { assignedParents: user._id } : { assignedTherapists: user._id };
  if (user.role === ROLES.THERAPIST) {
    const createdParents = await User.find({ role: ROLES.PARENT, createdBy: user._id }).select("_id");
    kidFilter = {
      $or: [
        { assignedTherapists: user._id },
        { assignedParents: { $in: createdParents.map((parent) => parent._id) } },
      ],
    };
  }
  const kids = await Kid.find(kidFilter).select("_id firstName lastName currentLevel");
  const kidIds = kids.map((k) => k._id);

  const [sessionsCount, historyCount, avgScore] = await Promise.all([
    Session.countDocuments({ kid: { $in: kidIds } }),
    PhraseHistory.countDocuments({ kid: { $in: kidIds } }),
    ScoreHistory.aggregate([
      { $match: { kid: { $in: kidIds } } },
      { $group: { _id: null, value: { $avg: "$value" } } },
    ]),
  ]);

  return {
    role: user.role,
    trackedKids: kids.length,
    sessionsCount,
    historyCount,
    averageScore: Number((avgScore[0]?.value || 0).toFixed(2)),
    kids,
  };
};

const getGlobalAnalytics = async () => {
  const [
    usersByRole,
    totalUserAccounts,
    totalKids,
    totalPictograms,
    totalCategories,
    totalScenarios,
    totalSessions,
    totalHistory,
    recentSessions,
    sessionsForTrend,
    pictogramsByCategory,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments(),
    Kid.countDocuments(),
    Pictogram.countDocuments(),
    Category.countDocuments(),
    Scenario.countDocuments(),
    Session.countDocuments(),
    PhraseHistory.countDocuments(),
    Session.find().sort({ startedAt: -1 }).limit(50).populate("kid", "firstName lastName"),
    Session.find().sort({ startedAt: -1 }).limit(60).select("startedAt"),
    Pictogram.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          name: { $first: "$category.name" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, name: 1 } },
    ]),
  ]);

  const usersByRoleWithKids = [...usersByRole];
  const childRoleIndex = usersByRoleWithKids.findIndex((item) => item._id === ROLES.CHILD);
  if (childRoleIndex >= 0) {
    usersByRoleWithKids[childRoleIndex].count = (usersByRoleWithKids[childRoleIndex].count || 0) + totalKids;
  } else {
    usersByRoleWithKids.push({ _id: ROLES.CHILD, count: totalKids });
  }

  const totalPlatformProfiles = totalUserAccounts + totalKids;

  return {
    usersByRole: usersByRoleWithKids,
    users: totalPlatformProfiles,
    kids: totalKids,
    pictograms: totalPictograms,
    categories: totalCategories,
    scenarios: totalScenarios,
    sessions: totalSessions,
    histories: totalHistory,
    totalUserAccounts,
    totalPlatformProfiles,
    totalKids,
    totalPictograms,
    totalCategories,
    totalScenarios,
    totalSessions,
    totalHistory,
    recentSessions,
    sessionTrend: {
      weekly: buildRecentDaySeries(sessionsForTrend, 7),
      monthly: buildRecentWeekSeries(sessionsForTrend, 4),
    },
    pictogramsByCategory,
  };
};

module.exports = { getKidAnalytics, getDashboardAnalytics, getGlobalAnalytics };

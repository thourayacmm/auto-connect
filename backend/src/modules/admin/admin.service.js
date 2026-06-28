const { AccessControl } = require("../access-control/accessControl.model");
const { User } = require("../users/user.model");
const { Kid } = require("../kids/kid.model");
const { Pictogram } = require("../pictograms/pictogram.model");
const { Category } = require("../categories/category.model");
const { Scenario } = require("../scenarios/scenario.model");
const { Session } = require("../sessions/session.model");
const { PhraseHistory } = require("../history/phraseHistory.model");
const { Recommendation } = require("../recommendations/recommendation.model");
const { ScoreHistory } = require("../scores/scoreHistory.model");
const { AIInteraction } = require("../ai/aiInteraction.model");

const getOverview = async () => {
  const [users, kids, pictograms, categories, scenarios, sessions, histories, recommendations, scores, aiInteractions] =
    await Promise.all([
      User.countDocuments(),
      Kid.countDocuments(),
      Pictogram.countDocuments(),
      Category.countDocuments(),
      Scenario.countDocuments(),
      Session.countDocuments(),
      PhraseHistory.countDocuments(),
      Recommendation.countDocuments(),
      ScoreHistory.countDocuments(),
      AIInteraction.countDocuments(),
    ]);

  return {
    users,
    kids,
    pictograms,
    categories,
    scenarios,
    sessions,
    histories,
    recommendations,
    scores,
    aiInteractions,
  };
};

const getStatistics = async () => {
  const overview = await getOverview();
  return {
    ...overview,
    totalUserAccounts: overview.users,
    totalKids: overview.kids,
    totalPictograms: overview.pictograms,
    totalCategories: overview.categories,
    totalScenarios: overview.scenarios,
    totalSessions: overview.sessions,
    totalHistory: overview.histories,
    totalRecommendations: overview.recommendations,
    totalScores: overview.scores,
    totalAiInteractions: overview.aiInteractions,
    totalPlatformProfiles: overview.users + overview.kids,
  };
};

const getAudit = async () => {
  const [recentUsers, recentKids, recentSessions, recentHistories] = await Promise.all([
    User.find().sort({ updatedAt: -1 }).limit(10).select("firstName lastName role email updatedAt"),
    Kid.find().sort({ updatedAt: -1 }).limit(10).select("firstName lastName status updatedAt"),
    Session.find().sort({ updatedAt: -1 }).limit(10).select("kid startedAt endedAt duration updatedAt"),
    PhraseHistory.find().sort({ updatedAt: -1 }).limit(10).select("kid source score usedAt updatedAt"),
  ]);

  return { recentUsers, recentKids, recentSessions, recentHistories };
};

const getAccessControl = async () => AccessControl.find().sort({ role: 1, resource: 1 });

const updateAccessControl = async (entries) => {
  const bulkOps = entries.map((entry) => ({
    updateOne: {
      filter: { role: entry.role, resource: entry.resource },
      update: { $set: { actions: entry.actions } },
      upsert: true,
    },
  }));
  if (bulkOps.length) await AccessControl.bulkWrite(bulkOps);
  return getAccessControl();
};

module.exports = { getOverview, getStatistics, getAudit, getAccessControl, updateAccessControl };

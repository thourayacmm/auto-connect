const { AccessRequest } = require("../access-requests/accessRequest.model");
const { Recommendation } = require("../recommendations/recommendation.model");
const { Kid } = require("../kids/kid.model");
const { User } = require("../users/user.model");
const { ROLES } = require("../../constants/roles");

const buildAccessRequestNotification = (request) => ({
  id: `access-${request._id}`,
  type: "access-request",
  title: request.status === "pending" ? "Demande d'acces en attente" : "Demande d'acces mise a jour",
  patient: request.patientName,
  message:
    request.status === "pending"
      ? `${request.requesterName} demande: ${request.permission}`
      : `Votre demande "${request.permission}" est ${request.status === "approved" ? "approuvee" : "refusee"}.`,
  detail: request.justification,
  time: request.createdAt,
  status: request.status,
});

const buildRecommendationNotification = (recommendation) => ({
  id: `recommendation-${recommendation._id}`,
  type: "recommendation",
  title: recommendation.title || "Nouvelle recommandation IA",
  patient: recommendation.kid?.firstName
    ? `${recommendation.kid.firstName} ${recommendation.kid.lastName || ""}`.trim()
    : "Enfant",
  message: recommendation.content,
  detail: recommendation.reason || recommendation.content,
  time: recommendation.createdAt,
  status: "info",
});

const listNotifications = async (user) => {
  const accessFilter =
    user.role === ROLES.ADMIN
      ? { status: "pending" }
      : user.role === ROLES.PARENT || user.role === ROLES.THERAPIST
        ? { requester: user._id }
        : null;

  const tasks = [];
  if (accessFilter) {
    tasks.push(AccessRequest.find(accessFilter).sort({ updatedAt: -1 }).limit(20));
  } else {
    tasks.push(Promise.resolve([]));
  }

  if ([ROLES.ADMIN, ROLES.PARENT, ROLES.THERAPIST, ROLES.CHILD].includes(user.role)) {
    let recommendationFilter = {};
    if (user.role === ROLES.CHILD) {
      recommendationFilter = { kid: user.kidId || user._id };
    } else if (user.role === ROLES.PARENT) {
      const kids = await Kid.find({ assignedParents: user._id }).select("_id");
      recommendationFilter = { kid: { $in: kids.map((kid) => kid._id) } };
    } else if (user.role === ROLES.THERAPIST) {
      const createdParents = await User.find({ role: ROLES.PARENT, createdBy: user._id }).select("_id");
      const kids = await Kid.find({
        $or: [
          { assignedTherapists: user._id },
          { assignedParents: { $in: createdParents.map((parent) => parent._id) } },
        ],
      }).select("_id");
      recommendationFilter = { kid: { $in: kids.map((kid) => kid._id) } };
    }

    tasks.push(
      Recommendation.find(recommendationFilter)
        .populate("kid", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(10),
    );
  } else {
    tasks.push(Promise.resolve([]));
  }

  const [accessRequests, recommendations] = await Promise.all(tasks);
  return [
    ...accessRequests.map(buildAccessRequestNotification),
    ...recommendations.map(buildRecommendationNotification),
  ]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 30);
};

module.exports = { listNotifications };

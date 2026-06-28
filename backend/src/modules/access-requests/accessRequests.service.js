const { AccessRequest } = require("./accessRequest.model");
const { AccessControl } = require("../access-control/accessControl.model");
const { ROLES } = require("../../constants/roles");
const { PERMISSIONS } = require("../../constants/permissions");
const { ApiError } = require("../../utils/ApiError");
const { Kid } = require("../kids/kid.model");
const { canAccessKid } = require("../../middlewares/ownership.middleware");

const populateSpec = [
  { path: "requester", select: "firstName lastName email role" },
  { path: "kid", select: "firstName lastName currentLevel status" },
  { path: "reviewedBy", select: "firstName lastName email role" },
];

const normalizeRequest = (request) => {
  const obj = request.toObject ? request.toObject() : { ...request };
  return {
    ...obj,
    id: String(obj._id || obj.id),
    requesterName: obj.requesterName,
    requesterRole: obj.requesterRole,
    patientName: obj.patientName,
  };
};

const buildFilter = (query, user) => {
  const filter = { requesterRole: ROLES.THERAPIST };
  if (query.status) filter.status = query.status;

  if (user.role !== ROLES.ADMIN || query.mine) {
    filter.requester = user._id;
  }

  return filter;
};

const permissionRequestMap = {
  "acces aux statistiques detaillees": { resource: "analytics", action: PERMISSIONS.ANALYTICS_READ },
  "acces aux rapports detailles": { resource: "analytics", action: PERMISSIONS.ANALYTICS_READ },
  "acces aux rapports ia avances": { resource: "ai", action: PERMISSIONS.AI_USE },
  "ajout de pictogrammes sensibles": { resource: "pictograms", action: PERMISSIONS.PICTOGRAMS_WRITE },
  "modification des scenarios avances": { resource: "scenarios", action: PERMISSIONS.SCENARIOS_WRITE },
  "edition des preferences enfant": { resource: "kids", action: PERMISSIONS.KIDS_WRITE },
};

const normalizePermissionLabel = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const applyApprovedPermission = async (request) => {
  const mapping = permissionRequestMap[normalizePermissionLabel(request.permission)];
  if (!mapping) return;

  await AccessControl.updateOne(
    { role: request.requesterRole, resource: mapping.resource },
    { $addToSet: { actions: mapping.action } },
    { upsert: true },
  );
};

const listAccessRequests = async (query, user) => {
  const requests = await AccessRequest.find(buildFilter(query, user))
    .populate(populateSpec)
    .sort({ createdAt: -1 })
    .limit(200);
  return requests.map(normalizeRequest);
};

const createAccessRequest = async (payload, user) => {
  if (user.role !== ROLES.THERAPIST) {
    throw new ApiError(403, "Only therapists can create access requests");
  }

  const requesterName =
    user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Utilisateur";
  let patientName = payload.patientName;

  if (payload.kidId) {
    const allowed = await canAccessKid(payload.kidId, user);
    if (!allowed) throw new ApiError(403, "Unauthorized access request for this kid");
    const kid = await Kid.findById(payload.kidId).select("firstName lastName");
    if (!kid) throw new ApiError(404, "Kid not found");
    patientName = `${kid.firstName} ${kid.lastName || ""}`.trim();
  }

  const request = await AccessRequest.create({
    requester: user._id,
    requesterName,
    requesterRole: user.role,
    kid: payload.kidId || null,
    patientName,
    permission: payload.permission,
    type: payload.type,
    justification: payload.justification,
  });

  return normalizeRequest(await request.populate(populateSpec));
};

const updateAccessRequestStatus = async (id, payload, user) => {
  if (user.role !== ROLES.ADMIN) {
    throw new ApiError(403, "Only admin can review access requests");
  }

  const request = await AccessRequest.findByIdAndUpdate(
    id,
    {
      status: payload.status,
      reviewedBy: user._id,
      reviewedAt: new Date(),
      reviewNote: payload.reviewNote || "",
    },
    { new: true },
  ).populate(populateSpec);

  if (!request) throw new ApiError(404, "Access request not found");
  if (request.requesterRole !== ROLES.THERAPIST) {
    throw new ApiError(403, "Only therapist access requests can be reviewed");
  }
  if (payload.status === "approved") {
    await applyApprovedPermission(request);
  }
  return normalizeRequest(request);
};

const getCounts = async (user) => {
  const baseFilter = user.role === ROLES.ADMIN
    ? { requesterRole: ROLES.THERAPIST }
    : { requester: user._id, requesterRole: ROLES.THERAPIST };
  const [pending, approved, rejected] = await Promise.all([
    AccessRequest.countDocuments({ ...baseFilter, status: "pending" }),
    AccessRequest.countDocuments({ ...baseFilter, status: "approved" }),
    AccessRequest.countDocuments({ ...baseFilter, status: "rejected" }),
  ]);
  return { pending, approved, rejected };
};

module.exports = {
  createAccessRequest,
  getCounts,
  listAccessRequests,
  updateAccessRequestStatus,
};

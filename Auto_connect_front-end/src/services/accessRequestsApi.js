import { apiGet, apiPatch, apiPost } from "./apiClient";

const statusToBackend = {
  "En attente": "pending",
  Approuve: "approved",
  Refuse: "rejected",
};

const statusToFrontend = {
  pending: "En attente",
  approved: "Approuve",
  rejected: "Refuse",
};

export const normalizeAccessRequest = (request) => ({
  ...request,
  id: request.id || request._id,
  requester: request.requesterName || request.requester || request.therapist,
  patient: request.patientName || request.patient,
  role: request.role || request.requesterRole?.toUpperCase?.() || "THERAPIST",
  permission: request.permission,
  type: request.type,
  justification: request.justification,
  status: statusToFrontend[request.status] || request.status || "En attente",
  createdAt: request.createdAt?.slice?.(0, 10) || request.createdAt,
});

export const listAccessRequestsApi = async ({ mine = false, status } = {}) => {
  const params = new URLSearchParams();
  if (mine) params.set("mine", "true");
  if (status) params.set("status", statusToBackend[status] || status);
  const suffix = params.toString() ? `?${params}` : "";
  const payload = await apiGet(`/access-requests${suffix}`);
  return {
    requests: (payload.data || []).map(normalizeAccessRequest),
    counts: payload.meta?.counts || null,
  };
};

export const createAccessRequestApi = async (body) => {
  const payload = await apiPost("/access-requests", {
    kidId: body.kidId,
    patientName: body.patient,
    permission: body.permission,
    type: body.type,
    justification: body.justification,
  });
  return normalizeAccessRequest(payload.data);
};

export const updateAccessRequestStatusApi = async (id, status) => {
  const payload = await apiPatch(`/access-requests/${id}/status`, {
    status: statusToBackend[status] || status,
  });
  return normalizeAccessRequest(payload.data);
};

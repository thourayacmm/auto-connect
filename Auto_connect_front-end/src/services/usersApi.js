import { apiDelete, apiGetAllPages, apiPatch, apiPost, apiPut, normalizeUser, toBackendRole } from "./apiClient";

const splitName = (name) => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || firstName };
};

export const listUsersApi = async ({ role } = {}) => {
  const params = new URLSearchParams();
  if (role) params.set("role", toBackendRole(role));
  const items = await apiGetAllPages(`/users${params.toString() ? `?${params}` : ""}`);
  return items.map(normalizeUser);
};

export const createUserApi = async ({ name, email, password, role, phone, specialty, address }) => {
  const payload = await apiPost("/users", {
    ...splitName(name),
    email,
    password,
    role: toBackendRole(role),
    phone,
    specialty,
    address,
  });
  return normalizeUser(payload.data);
};

export const updateUserApi = async (id, { name, email, phone, specialty, address }) => {
  const payload = await apiPut(`/users/${id}`, {
    ...splitName(name),
    email,
    phone,
    specialty,
    address,
  });
  return normalizeUser(payload.data);
};

export const updateUserStatusApi = async (id, isActive) => {
  const payload = await apiPatch(`/users/${id}/status`, { isActive });
  return normalizeUser(payload.data);
};

export const deleteUserApi = async (id) => apiDelete(`/users/${id}`);

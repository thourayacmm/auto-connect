import { apiGet, apiPost, normalizeUser, toBackendRole } from "./apiClient";

export const loginApi = async ({ email, password, role }) => {
  const payload = await apiPost("/auth/login", { email, password });
  const user = normalizeUser(payload.data?.user, payload.data?.token);

  if (role && user?.role !== role) {
    throw new Error("Ce compte ne correspond pas au role selectionne.");
  }

  return user;
};

export const childSessionApi = async ({ accessCode }) => {
  const payload = await apiPost("/auth/child-session", { accessCode });
  return normalizeUser(payload.data?.user, payload.data?.token);
};

export const createUserApi = async ({ name, email, password, role, phone, specialty, address }) => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  const payload = await apiPost("/users", {
    firstName,
    lastName: rest.join(" ") || firstName,
    email,
    password,
    role: toBackendRole(role),
    phone,
    specialty,
    address,
  });
  return normalizeUser(payload.data);
};

export const getMeApi = async () => {
  const payload = await apiGet("/auth/me");
  return normalizeUser(payload.data);
};

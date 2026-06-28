import { AUTH_STORAGE_KEY } from "../utils/constants";
import { ROLES } from "../utils/roles";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000/api";

const backendToFrontendRole = {
  admin: ROLES.ADMIN,
  therapist: ROLES.THERAPIST,
  parent: ROLES.PARENT,
  child: ROLES.CHILD,
};

const frontendToBackendRole = {
  [ROLES.ADMIN]: "admin",
  [ROLES.THERAPIST]: "therapist",
  [ROLES.PARENT]: "parent",
  [ROLES.CHILD]: "child",
};

export const toBackendRole = (role) => frontendToBackendRole[role] || role?.toLowerCase?.() || role;

export const normalizeUser = (user, token = null) => {
  if (!user) return null;

  const firstName = user.firstName || user.name?.split(" ")?.[0] || "";
  const lastName = user.lastName || user.name?.split(" ")?.slice(1).join(" ") || "";
  const name = user.name || user.fullName || `${firstName} ${lastName}`.trim() || user.email;

  return {
    ...user,
    id: user.id || user._id || user.kidId,
    _id: user._id || user.id || user.kidId,
    name,
    firstName,
    lastName,
    role: backendToFrontendRole[user.role] || user.role,
    token: token || user.token,
    children: Array.isArray(user.children)
      ? user.children.map((child) => ({
          ...child,
          id: child.id || child._id,
          _id: child._id || child.id,
          name: child.name || `${child.firstName || ""} ${child.lastName || ""}`.trim(),
          parentId: child.parentId,
          therapistIds: child.therapistIds || [],
        }))
      : [],
    childrenCount: Number(user.childrenCount || user.children?.length || 0),
  };
};

export const getAuthToken = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.token : null;
  } catch (_error) {
    return null;
  }
};

export const apiRequest = async (path, options = {}) => {
  const token = getAuthToken();
  const method = options.method || "GET";
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(method === "GET" ? { "Cache-Control": "no-cache" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    cache: method === "GET" ? "no-store" : "default",
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(payload?.message || "Trop de tentatives. Attendez quelques minutes puis reessayez.");
    }

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      const isPublicAuthPage =
        window.location.pathname === "/" || window.location.pathname.startsWith("/login");
      if (token && !isPublicAuthPage) {
        window.location.assign("/login");
      }
    }
    throw new Error(payload?.message || `Erreur API ${response.status}`);
  }

  return payload;
};

export const apiGet = (path) => apiRequest(path);

export const apiGetAllPages = async (path, { pageSize = 100 } = {}) => {
  const [basePath, queryString = ""] = path.split("?");
  const params = new URLSearchParams(queryString);
  params.set("limit", String(pageSize));

  const allItems = [];
  let page = 1;
  let totalPages = 1;

  do {
    params.set("page", String(page));
    const payload = await apiGet(`${basePath}?${params}`);
    allItems.push(...(payload.data || []));
    totalPages = Number(payload.meta?.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  return allItems;
};

export const apiPost = (path, body) =>
  apiRequest(path, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const apiPostForm = (path, body) =>
  apiRequest(path, {
    method: "POST",
    body,
  });

export const apiPatch = (path, body) =>
  apiRequest(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const apiPut = (path, body) =>
  apiRequest(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const apiDelete = (path) => apiRequest(path, { method: "DELETE" });

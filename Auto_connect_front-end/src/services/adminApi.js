import { apiGet, apiPut } from "./apiClient";

export const listAccessControlApi = async () => {
  const payload = await apiGet("/admin/access-control");
  return payload.data || [];
};

export const updateAccessControlApi = async (entries) => {
  const payload = await apiPut("/admin/access-control", { entries });
  return payload.data || [];
};

import { apiGet } from "./apiClient";

export const listNotificationsApi = async () => {
  const payload = await apiGet("/notifications");
  return payload.data || [];
};

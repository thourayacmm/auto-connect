import { apiGet, apiPut } from "./apiClient";

export const normalizePreferences = (payload = {}) => ({
  language: payload.language || "fr",
  gridSize: payload.gridSize || "medium",
  childTheme: payload.childTheme || payload.visualTheme || "sky",
  childVoice: payload.childVoice || "fr",
  childPictogramSize: String(payload.childPictogramSize || "4"),
  childSuggestions: payload.childSuggestions || "on",
  childLevel: payload.childLevel || payload.currentLevel || "Debutant",
});

export const getPreferencesApi = async () => {
  const payload = await apiGet("/preferences");
  return normalizePreferences(payload.data?.preferences);
};

export const updatePreferencesApi = async (preferences) => {
  const payload = await apiPut("/preferences", preferences);
  return normalizePreferences(payload.data?.preferences);
};

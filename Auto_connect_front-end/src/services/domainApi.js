import { apiDelete, apiGet, apiGetAllPages, apiPost, apiPut } from "./apiClient";

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") return String(value.id || value._id || value.$oid || "");
  return "";
};

const getPersonName = (person) => {
  if (!person || typeof person === "string") return "";
  return (
    person.name ||
    person.fullName ||
    `${person.firstName || ""} ${person.lastName || ""}`.trim()
  );
};

const getPersonEmail = (person) => {
  if (!person || typeof person === "string") return "";
  return person.email || "";
};

export const normalizeKid = (kid) => {
  const firstParent = kid.assignedParents?.[0];
  const firstTherapist = kid.assignedTherapists?.[0];

  return {
    ...kid,
    id: kid.id || kid._id,
    name: kid.name || `${kid.firstName || ""} ${kid.lastName || ""}`.trim(),
    level: kid.currentLevel || kid.level,
    parentId: getEntityId(firstParent) || getEntityId(kid.parentId),
    therapistId: getEntityId(firstTherapist) || getEntityId(kid.therapistId),
    parentName: getPersonName(firstParent) || kid.parentName,
    parentEmail: getPersonEmail(firstParent) || kid.parentEmail,
    therapistName: getPersonName(firstTherapist) || kid.therapistName,
    therapistEmail: getPersonEmail(firstTherapist) || kid.therapistEmail,
    childCode: kid.sessionAccessCode || kid.childCode,
  };
};

export const normalizeCategory = (category) => ({
  ...category,
  id: category.id || category._id,
  label: category.name,
});

export const normalizePictogram = (item) => ({
  ...item,
  id: item.id || item._id,
  label: item.label || item.name,
  category: item.category?.name || item.category || "General",
  subcategory: item.subcategory || item.description || "General",
  color: item.category?.color || item.color || "#d7f4ff",
  icon: item.icon || "Bot",
  imageUrl: item.imageUrl,
  level: item.level || "Debutant",
  ageMin: item.ageMin ?? 2,
  ageMax: item.ageMax ?? 25,
});

export const normalizeScenario = (scenario) => ({
  ...scenario,
  id: scenario.id || scenario._id,
  title: scenario.title,
  level: scenario.targetLevel || scenario.level,
  ageMin: scenario.ageMin ?? 2,
  ageMax: scenario.ageMax ?? 25,
  ageTarget: scenario.ageTarget || `${scenario.ageMin ?? 2}-${scenario.ageMax ?? 25} ans`,
  childGoal: scenario.childGoal || "",
  blockageHelp: scenario.blockageHelp || "",
  steps: scenario.steps || scenario.pictogramSequence?.map((item) => item.name || item.label) || [],
  pictograms: scenario.pictogramSequence?.map(normalizePictogram) || scenario.pictograms || [],
  assignedKids: (scenario.assignedKids || []).map(normalizeKid),
});

export const listKidsApi = async () => {
  const items = await apiGetAllPages("/kids");
  return items.map(normalizeKid);
};

export const createKidApi = async (body) => {
  const [nameFirst, ...nameRest] = String(body.name || "").trim().split(/\s+/).filter(Boolean);
  const sessionAccessCode = String(body.sessionAccessCode || "").trim();
  const payloadBody = {
    firstName: String(body.firstName || nameFirst || "").trim(),
    lastName: String(body.lastName || nameRest.join(" ") || nameFirst || "").trim(),
    age: Number(body.age),
    currentLevel: body.currentLevel || body.level || "Debutant",
    communicationLevel: body.communicationLevel || body.level || "Debutant",
    difficultyType: body.difficultyType || "Communication",
    status: body.status || "active",
  };

  if (sessionAccessCode) {
    payloadBody.sessionAccessCode = sessionAccessCode;
  }

  const payload = await apiPost("/kids", payloadBody);
  return normalizeKid(payload.data);
};

export const deleteKidApi = async (kidId) => apiDelete(`/kids/${kidId}`);

export const getKidProgressApi = async (kidId) => {
  const payload = await apiGet(`/kids/${kidId}/progress`);
  return payload.data;
};

export const getKidHistoryApi = async (kidId) => {
  const payload = await apiGet(`/kids/${kidId}/history`);
  return payload.data || [];
};

export const getKidSessionsApi = async (kidId) => {
  const payload = await apiGet(`/kids/${kidId}/sessions`);
  return payload.data || [];
};

export const getKidRecommendationsApi = async (kidId) => {
  const payload = await apiGet(`/kids/${kidId}/recommendations`);
  return payload.data || [];
};

export const listCategoriesApi = async () => {
  const items = await apiGetAllPages("/categories");
  return items.map(normalizeCategory);
};

export const createCategoryApi = async (body) => {
  const payload = await apiPost("/categories", body);
  return normalizeCategory(payload.data);
};

export const listPictogramsApi = async (query = {}) => {
  const params = new URLSearchParams(query);
  const items = await apiGetAllPages(`/pictograms?${params}`);
  return items.map(normalizePictogram);
};

export const createPictogramApi = async (body) => {
  const payload = await apiPost("/pictograms", body);
  return normalizePictogram(payload.data);
};

export const updatePictogramApi = async (id, body) => {
  const payload = await apiPut(`/pictograms/${id}`, body);
  return normalizePictogram(payload.data);
};

export const deletePictogramApi = async (id) => apiDelete(`/pictograms/${id}`);

export const listScenariosApi = async (query = {}) => {
  const params = new URLSearchParams(query);
  const items = await apiGetAllPages(`/scenarios?${params}`);
  return items.map(normalizeScenario);
};

export const createScenarioApi = async (body) => {
  const payload = await apiPost("/scenarios", body);
  return normalizeScenario(payload.data);
};

export const updateScenarioApi = async (id, body) => {
  const payload = await apiPut(`/scenarios/${id}`, body);
  return normalizeScenario(payload.data);
};

export const deleteScenarioApi = async (id) => apiDelete(`/scenarios/${id}`);

export const listHistoryApi = async () => {
  return apiGetAllPages("/history");
};

export const createHistoryApi = async (body) => {
  const payload = await apiPost("/history", {
    kid: body.kid || body.kidId,
    pictograms: body.pictograms || [],
    generatedText: body.generatedText || body.phraseText || body.sentence,
    correctedText: body.correctedText || null,
    audioPlayed: body.audioPlayed ?? true,
    score: body.score ?? null,
    duration: body.duration ?? undefined,
    source: ["manual", "scenario", "ai"].includes(body.source) ? body.source : "manual",
    usedAt: body.usedAt || new Date().toISOString(),
  });
  return payload.data;
};

export const startSessionApi = async (body) => {
  const payload = await apiPost("/sessions/start", body);
  return payload.data;
};

export const endSessionApi = async (body) => {
  const payload = await apiPost("/sessions/end", body);
  return payload.data;
};

export const getDashboardAnalyticsApi = async () => {
  const payload = await apiGet("/analytics/dashboard");
  return payload.data;
};

export const getGlobalAnalyticsApi = async () => {
  const payload = await apiGet("/analytics/global");
  return payload.data;
};

export const getAdminOverviewApi = async () => {
  const payload = await apiGet("/admin/overview");
  return payload.data;
};

export const getAdminStatisticsApi = async () => {
  const payload = await apiGet("/admin/statistics");
  return payload.data;
};

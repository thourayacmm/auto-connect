import { apiPost, apiPostForm } from "./apiClient";

const unwrapData = (payload) => payload?.data || payload || {};

const normalizeCorrectionResult = (result, fallbackText) => {
  const data = result?.data || result || {};
  const correctedText = data.correctedText || data.corrected_text || data.corrected || fallbackText || "";

  return {
    ...data,
    correctedText,
    corrected_text: correctedText,
    normalizedText: data.normalizedText || data.normalized_text || correctedText.toLowerCase().replace(/[.!?]+$/, ""),
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : correctedText ? [correctedText] : [],
  };
};

export const correctPhrase = async ({ text, pictogramLabels = [] }) => {
  const rawText = text?.trim() || "";
  const result = await apiPost("/ai/correct-phrase", {
    text,
    pictogramLabels,
    language: "fr",
  });
  return normalizeCorrectionResult(unwrapData(result), [...pictogramLabels, rawText].filter(Boolean).join(" "));
};

export const calculateScore = async ({ kidId, phrase, sessionData = {} }) => {
  const result = await apiPost("/ai/score", {
    kidId,
    phrase,
    sessionData,
  });
  return unwrapData(result);
};

export const askAssistant = ({ query, role = "parent", context = {} }) =>
  apiPost("/ai/chat", {
    query,
    role,
    context,
    topK: 4,
  }).then(unwrapData);

export const generateRecommendations = ({ history = [], profile = {} } = {}) =>
  apiPost("/ai/recommend", {
    kidId: profile.kidId,
    history,
    profile,
    previousRecommendations: profile.previousRecommendations || [],
  }).then((payload) => {
    const data = unwrapData(payload);
    return {
      ...data.raw,
      ...data,
      recommended_pictograms:
        data.raw?.recommended_pictograms ||
        data.recommendations?.filter((item) => item.type === "pictogram") ||
        [],
      recommended_scenarios:
        data.raw?.recommended_scenarios ||
        data.recommendations?.filter((item) => item.type === "scenario") ||
        [],
      adaptation_suggestions:
        data.raw?.adaptation_suggestions ||
        data.recommendations?.filter((item) => item.type === "level").map((item) => item.content) ||
        [],
      supervisor_tips:
        data.raw?.supervisor_tips ||
        data.recommendations?.filter((item) => item.type === "message").map((item) => item.content) ||
        [],
    };
  });

export const transcribeAudio = async (audioFile, { language = "fr" } = {}) => {
  const formData = new FormData();
  formData.append("audio_file", audioFile);
  formData.append("language", language);
  const result = await apiPostForm("/ai/stt", formData);
  const data = unwrapData(result);
  return {
    ...data,
    text: data.text || data.texte || "",
  };
};

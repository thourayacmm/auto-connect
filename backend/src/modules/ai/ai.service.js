const { Recommendation } = require("../recommendations/recommendation.model");
const { ScoreHistory } = require("../scores/scoreHistory.model");
const { callAi, getAi, postAiMultipart } = require("./aiClient.service");
const { AIInteraction } = require("./aiInteraction.model");

const DEFAULT_AGE = 8;
const DEFAULT_LEVEL = "Niveau 1";
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

const logInteraction = async ({ action, payload, result, status = "success", errorMessage = null }) =>
  AIInteraction.create({
    kid: payload?.kidId || null,
    action,
    requestPayload: payload,
    responsePayload: result || null,
    status,
    errorMessage,
  });

const isObjectId = (value) => typeof value === "string" && OBJECT_ID_REGEX.test(value);
const ensureArray = (value) => (Array.isArray(value) ? value : []);
const uniqueStrings = (values) => [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const average = (values) => {
  const safe = ensureArray(values).map((item) => Number(item)).filter((item) => Number.isFinite(item));
  if (!safe.length) return 0;
  return safe.reduce((sum, item) => sum + item, 0) / safe.length;
};

const buildInteractionSequence = (interactions) =>
  ensureArray(interactions).map((item, index) => ({
    pictogram_id: String(item?.pictogramId || item?.id || item?._id || `pic-${index + 1}`),
    label: String(item?.label || item?.name || item?.text || `Pictogram ${index + 1}`),
    category: item?.category ? String(item.category) : "General",
    selected_at: item?.selectedAt != null ? Number(item.selectedAt) : item?.timestamp != null ? Number(item.timestamp) : index,
    duration_ms: item?.durationMs != null ? Number(item.durationMs) : undefined,
  }));

const buildAnalyzePayload = (payload) => {
  const context = payload?.context || {};
  const profile = context.profile || {};
  const interactions = buildInteractionSequence(payload?.interactions);

  return {
    kid_id: payload?.kidId || "general-analysis",
    age: Math.max(2, Math.min(25, toFiniteNumber(context.age || profile.age, DEFAULT_AGE))),
    current_level: context.currentLevel || profile.currentLevel || DEFAULT_LEVEL,
    session_id: context.sessionId || null,
    pictogram_sequence: interactions,
    scenario_id: context.scenarioId || null,
    phrase_text: context.phraseText || null,
    duration_seconds: Math.max(0, toFiniteNumber(context.durationSeconds || context.duration, 0)),
    timestamps: ensureArray(context.timestamps).map((item) => Number(item)).filter((item) => Number.isFinite(item)),
    usage_frequency: toFiniteNumber(context.usageFrequency, interactions.length || 0),
    previous_scores: ensureArray(context.previousScores).map((item) => Number(item)).filter((item) => Number.isFinite(item)),
    history_summary: context.historySummary || null,
  };
};

const mapAnalysisResponse = (aiResult) => ({
  strengths: ensureArray(aiResult?.strengths),
  difficulties: ensureArray(aiResult?.difficulties),
  repeatedPatterns: ensureArray(aiResult?.repeated_patterns),
  usedCategories: ensureArray(aiResult?.used_categories),
  engagementLevel: aiResult?.engagement_level || "moderate",
  summary: aiResult?.summary || "",
  suggestedActions: ensureArray(aiResult?.suggested_actions),
  confidence: aiResult?.confidence ?? null,
  cautionNote: aiResult?.caution_note || "",
});

const buildRecommendPayload = (payload) => {
  const profile = payload?.profile || {};
  const history = ensureArray(payload?.history);
  const recentCategories = uniqueStrings([
    ...ensureArray(profile.recentCategories),
    ...history.map((item) => item?.category),
  ]);
  const recentPictograms = uniqueStrings([
    ...ensureArray(profile.recentPictograms),
    ...history.map((item) => item?.label || item?.name || item?.text),
  ]);
  const latestScores = ensureArray(profile.latestScores || history.map((item) => item?.score))
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  return {
    kid_id: payload?.kidId || "general-recommendation",
    age: Math.max(2, Math.min(25, toFiniteNumber(profile.age, DEFAULT_AGE))),
    current_level: profile.currentLevel || DEFAULT_LEVEL,
    recent_categories: recentCategories,
    recent_pictograms: recentPictograms,
    previous_recommendations: ensureArray(payload?.previousRecommendations || profile.previousRecommendations).map(String),
    latest_scores: latestScores,
    objectives: ensureArray(profile.objectives).map(String),
  };
};

const mapRecommendations = (aiResult) => {
  const pictogramRecommendations = ensureArray(aiResult?.recommended_pictograms).map((item, index) => ({
    id: item?.pictogram_id || `pictogram-${index + 1}`,
    type: "pictogram",
    title: `Pictogramme: ${item?.label || "Suggestion"}`,
    content: `${item?.category || "General"} - ${item?.reason || "Suggestion IA."}`,
    reason: item?.reason || "",
    priority: "Haute",
  }));

  const scenarioRecommendations = ensureArray(aiResult?.recommended_scenarios).map((item, index) => ({
    id: item?.scenario_id || `scenario-${index + 1}`,
    type: "scenario",
    title: `Scenario: ${item?.title || "Suggestion"}`,
    content: item?.reason || `Adapte au ${item?.target_level || DEFAULT_LEVEL}.`,
    reason: item?.reason || "",
    priority: "Moyenne",
  }));

  const levelRecommendations = ensureArray(aiResult?.adaptation_suggestions).map((item, index) => ({
    id: `level-${index + 1}`,
    type: "level",
    title: "Adaptation du niveau",
    content: String(item),
    reason: aiResult?.explanation || "",
    priority: "Moyenne",
  }));

  const supervisorMessages = ensureArray(aiResult?.supervisor_tips).map((item, index) => ({
    id: `message-${index + 1}`,
    type: "message",
    title: "Conseil de supervision",
    content: String(item),
    reason: aiResult?.explanation || "",
    priority: "Info",
  }));

  return [...pictogramRecommendations, ...scenarioRecommendations, ...levelRecommendations, ...supervisorMessages];
};

const buildScorePayload = (payload) => {
  const sessionData = payload?.sessionData || {};
  const pictograms = ensureArray(sessionData.pictograms || sessionData.pictogramSequence);
  const labels = pictograms
    .map((item) => item?.label || item?.name || item?.text)
    .filter(Boolean)
    .map((item) => String(item).trim().toLowerCase());
  const distinctCount = new Set(labels).size;
  const repeatedCount = Math.max(labels.length - distinctCount, 0);
  const phraseCount =
    toFiniteNumber(sessionData.phraseCount, 0) ||
    (payload?.phrase?.trim() ? 1 : 0) ||
    toFiniteNumber(sessionData.completedPhrases, 0);

  return {
    kid_id: payload?.kidId || "general-score",
    current_level: sessionData.currentLevel || DEFAULT_LEVEL,
    phrase_count: Math.max(0, phraseCount),
    distinct_pictograms: Math.max(0, distinctCount),
    repeated_pictograms: Math.max(0, repeatedCount),
    session_duration: Math.max(0, toFiniteNumber(sessionData.duration || sessionData.sessionDuration, 0)),
    autonomy_indicators: sessionData.autonomyIndicators || {},
    correction_count: Math.max(0, toFiniteNumber(sessionData.correctionCount, 0)),
    historical_trend: sessionData.historicalTrend || null,
  };
};

const mapScoreResponse = (aiResult) => ({
  score: aiResult?.global_score ?? null,
  scoreType: "ai-score",
  scoreBreakdown: aiResult?.score_breakdown || {},
  interpretation: aiResult?.interpretation || "",
  explanation: aiResult?.interpretation || "",
  nextStep: aiResult?.next_step || "",
  confidence: aiResult?.confidence ?? null,
  cautionNote: aiResult?.caution_note || "",
});

const buildAdaptLevelPayload = (payload) => {
  const recentScores = ensureArray(payload?.recentScores).map((item) => Number(item)).filter((item) => Number.isFinite(item));

  return {
    kid_id: payload?.kidId || "general-adaptation",
    age: Math.max(2, Math.min(25, toFiniteNumber(payload?.age, DEFAULT_AGE))),
    current_level: payload?.currentLevel || DEFAULT_LEVEL,
    average_score: recentScores.length ? average(recentScores) : 0,
    progression_trend: toFiniteNumber(payload?.progressionTrend, 0),
    consistency_index: Math.max(0, Math.min(1, toFiniteNumber(payload?.consistencyIndex, 0.5))),
    completed_scenarios: Math.max(0, toFiniteNumber(payload?.completedScenarios, 0)),
    usage_regularity: Math.max(0, Math.min(1, toFiniteNumber(payload?.usageRegularity, 0.5))),
  };
};

const mapAdaptLevelResponse = (aiResult) => ({
  suggestedLevel: aiResult?.suggested_level || DEFAULT_LEVEL,
  shouldChange: Boolean(aiResult?.should_change),
  reason: aiResult?.reason || "",
  transitionRecommendations: ensureArray(aiResult?.transition_recommendations),
  confidence: aiResult?.confidence ?? null,
  cautionNote: aiResult?.caution_note || "",
});

const buildCorrectionPayload = (payload) => ({
  pictogram_labels: ensureArray(payload?.pictogramLabels || payload?.pictogram_labels).map(String),
  raw_text: payload?.text || payload?.rawText || payload?.raw_text || null,
  language: payload?.language || "fr",
  age_group: payload?.ageGroup || null,
});

const mapCorrectionResponse = (aiResult) => ({
  correctedText: aiResult?.corrected_text || "",
  normalizedText: aiResult?.normalized_text || "",
  suggestions: ensureArray(aiResult?.suggestions),
  explanation: aiResult?.explanation || "",
  confidence: aiResult?.confidence ?? null,
  cautionNote: aiResult?.caution_note || "",
});

const buildChatPayload = (payload) => ({
  kid_id: payload?.kidId || null,
  role: payload?.role || "parent",
  query: payload?.query,
  context_payload: payload?.context || {},
  top_k: payload?.topK || 4,
});

const mapChatResponse = (aiResult) => ({
  answer: aiResult?.answer || "",
  retrievedChunks: ensureArray(aiResult?.retrieved_chunks),
  reasoningSummary: aiResult?.reasoning_summary || "",
  recommendations: ensureArray(aiResult?.recommendations),
  confidence: aiResult?.confidence ?? null,
  cautionNote: aiResult?.caution_note || "",
});

const health = async () => getAi("/ai/health");

const analyze = async (payload) => {
  try {
    const aiPayload = buildAnalyzePayload(payload);
    const aiResult = await callAi("/ai/analyze-interactions", aiPayload);
    const result = mapAnalysisResponse(aiResult);
    await logInteraction({ action: "analyze", payload, result: aiResult });
    return {
      kidId: payload.kidId,
      analysis: result,
    };
  } catch (error) {
    await logInteraction({ action: "analyze", payload, status: "error", errorMessage: error.message });
    throw error;
  }
};

const recommend = async (payload) => {
  try {
    const aiPayload = buildRecommendPayload(payload);
    const aiResult = await callAi("/ai/generate-recommendations", aiPayload);
    const recommendations = mapRecommendations(aiResult);

    if (isObjectId(payload?.kidId)) {
      const docs = recommendations
        .filter((item) => item?.title && item?.content)
        .map((item) => ({
          kid: payload.kidId,
          type: item.type || "message",
          title: item.title,
          content: item.content,
          reason: item.reason || "",
          generatedBy: "ai",
        }));
      if (docs.length) await Recommendation.insertMany(docs);
    }

    await logInteraction({ action: "recommend", payload, result: aiResult });
    return {
      explanation: aiResult?.explanation || "",
      confidence: aiResult?.confidence ?? null,
      cautionNote: aiResult?.caution_note || "",
      recommendations,
      raw: aiResult,
    };
  } catch (error) {
    await logInteraction({ action: "recommend", payload, status: "error", errorMessage: error.message });
    throw error;
  }
};

const score = async (payload) => {
  try {
    const aiPayload = buildScorePayload(payload);
    const aiResult = await callAi("/ai/calculate-score", aiPayload);
    const result = mapScoreResponse(aiResult);

    if (isObjectId(payload?.kidId) && typeof result.score === "number") {
      await ScoreHistory.create({
        kid: payload.kidId,
        scoreType: result.scoreType || "ai-score",
        value: result.score,
        explanation: result.explanation || "",
        basedOn: payload,
        createdBy: "ai",
      });
    }
    await logInteraction({ action: "score", payload, result: aiResult });
    return result;
  } catch (error) {
    await logInteraction({ action: "score", payload, status: "error", errorMessage: error.message });
    throw error;
  }
};

const adaptLevel = async (payload) => {
  try {
    const aiPayload = buildAdaptLevelPayload(payload);
    const aiResult = await callAi("/ai/adapt-level", aiPayload);
    const result = mapAdaptLevelResponse(aiResult);
    await logInteraction({ action: "adapt-level", payload, result: aiResult });
    return result;
  } catch (error) {
    await logInteraction({ action: "adapt-level", payload, status: "error", errorMessage: error.message });
    throw error;
  }
};

const correctPhrase = async (payload) => {
  try {
    const aiPayload = buildCorrectionPayload(payload);
    const aiResult = await callAi("/ai/correct-phrase", aiPayload);
    const result = mapCorrectionResponse(aiResult);
    await logInteraction({ action: "correct-phrase", payload, result: aiResult });
    return result;
  } catch (error) {
    await logInteraction({ action: "correct-phrase", payload, status: "error", errorMessage: error.message });
    throw error;
  }
};

const chat = async (payload) => {
  try {
    const aiPayload = buildChatPayload(payload);
    const aiResult = await callAi("/ai/rag/query", aiPayload);
    const result = mapChatResponse(aiResult);
    await logInteraction({ action: "chat", payload, result: aiResult });
    return result;
  } catch (error) {
    await logInteraction({ action: "chat", payload, status: "error", errorMessage: error.message });
    throw error;
  }
};

const speechToText = async (file, payload = {}) => {
  try {
    const aiResult = await postAiMultipart("/stt", file, {
      language: payload?.language || "fr",
    });
    const result = {
      text: aiResult?.texte || "",
      language: payload?.language || "fr",
    };
    await logInteraction({
      action: "speech-to-text",
      payload: { ...payload, filename: file?.originalname, mimetype: file?.mimetype, size: file?.size },
      result: aiResult,
    });
    return result;
  } catch (error) {
    await logInteraction({
      action: "speech-to-text",
      payload: { ...payload, filename: file?.originalname, mimetype: file?.mimetype, size: file?.size },
      status: "error",
      errorMessage: error.message,
    });
    throw error;
  }
};

module.exports = { health, analyze, recommend, score, adaptLevel, correctPhrase, chat, speechToText };

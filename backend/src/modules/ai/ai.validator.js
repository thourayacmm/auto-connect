const { z, objectId } = require("../../validators/common.validators");

const analyzeSchema = z.object({
  kidId: objectId.optional(),
  interactions: z.array(z.any()).default([]),
  context: z.record(z.any()).optional(),
});

const recommendSchema = z.object({
  kidId: objectId.optional(),
  history: z.array(z.any()).default([]),
  profile: z.record(z.any()).optional(),
  previousRecommendations: z.array(z.string()).optional(),
});

const scoreSchema = z.object({
  kidId: objectId.optional(),
  phrase: z.string().optional(),
  sessionData: z.record(z.any()).optional(),
});

const adaptLevelSchema = z.object({
  kidId: objectId.optional(),
  currentLevel: z.string().optional(),
  recentScores: z.array(z.number()).optional(),
  age: z.number().int().min(2).max(25).optional(),
  progressionTrend: z.number().optional(),
  consistencyIndex: z.number().min(0).max(1).optional(),
  completedScenarios: z.number().int().min(0).optional(),
  usageRegularity: z.number().min(0).max(1).optional(),
});

const correctPhraseSchema = z.object({
  kidId: objectId.optional(),
  text: z.string().max(600).optional(),
  rawText: z.string().max(600).optional(),
  raw_text: z.string().max(600).optional(),
  pictogramLabels: z.array(z.string().min(1).max(80)).optional(),
  pictogram_labels: z.array(z.string().min(1).max(80)).optional(),
  language: z.string().min(2).max(10).optional(),
  ageGroup: z.string().max(30).optional(),
}).refine(
  (payload) =>
    Boolean(
      payload.text?.trim() ||
      payload.rawText?.trim() ||
      payload.raw_text?.trim() ||
      payload.pictogramLabels?.length ||
      payload.pictogram_labels?.length,
    ),
  { message: "text, rawText/raw_text or pictogramLabels/pictogram_labels is required" },
);

const chatSchema = z.object({
  kidId: objectId.optional(),
  role: z.enum(["parent", "therapist", "admin"]).optional(),
  query: z.string().min(2).max(800),
  context: z.record(z.any()).optional(),
  topK: z.number().int().min(1).max(10).optional(),
});

module.exports = {
  analyzeSchema,
  recommendSchema,
  scoreSchema,
  adaptLevelSchema,
  correctPhraseSchema,
  chatSchema,
};

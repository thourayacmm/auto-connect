const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");

const createHistorySchema = z.object({
  kid: objectId,
  pictograms: z.array(objectId).optional(),
  generatedText: z.string().min(1).max(600),
  correctedText: z.string().max(600).optional().nullable(),
  audioPlayed: z.boolean().optional(),
  score: z.number().min(0).max(100).optional().nullable(),
  duration: z.number().min(0).optional(),
  source: z.enum(["manual", "scenario", "ai"]).optional(),
  usedAt: z.string().datetime().optional(),
});

const kidIdParamSchema = z.object({ kidId: objectId });

const listHistoryQuerySchema = paginationQuerySchema.extend({
  kid: objectId.optional(),
  scoreMin: z.coerce.number().min(0).max(100).optional(),
  scoreMax: z.coerce.number().min(0).max(100).optional(),
  source: z.enum(["manual", "scenario", "ai"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

module.exports = { createHistorySchema, kidIdParamSchema, listHistoryQuerySchema };

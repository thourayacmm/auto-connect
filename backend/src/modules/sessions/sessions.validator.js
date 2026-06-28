const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");

const startSessionSchema = z.object({
  kid: objectId,
  scenario: objectId.optional().nullable(),
  startedAt: z.string().datetime().optional(),
  actions: z
    .array(
      z.object({
        type: z.string().min(1),
        payload: z.any().optional(),
        at: z.string().datetime().optional(),
      }),
    )
    .optional(),
});

const endSessionSchema = z.object({
  sessionId: objectId,
  endedAt: z.string().datetime().optional(),
  actions: z
    .array(
      z.object({
        type: z.string().min(1),
        payload: z.any().optional(),
        at: z.string().datetime().optional(),
      }),
    )
    .optional(),
  aiSummary: z.string().max(2000).optional(),
  score: z.number().min(0).max(100).optional(),
  recommendationsSnapshot: z.array(z.string()).optional(),
});

const idParamSchema = z.object({ id: objectId });

const listSessionsQuerySchema = paginationQuerySchema.extend({
  kid: objectId.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

module.exports = { startSessionSchema, endSessionSchema, idParamSchema, listSessionsQuerySchema };

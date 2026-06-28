const { z, objectId } = require("../../validators/common.validators");

const createAccessRequestSchema = z.object({
  kidId: objectId.optional(),
  patientName: z.string().min(1).max(120),
  permission: z.string().min(2).max(160),
  type: z.string().min(2).max(120),
  justification: z.string().min(5).max(1000),
});

const listAccessRequestsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  mine: z
    .string()
    .optional()
    .transform((value) => value === "true"),
});

const updateAccessRequestStatusSchema = z.object({
  status: z.enum(["approved", "rejected", "pending"]),
  reviewNote: z.string().max(500).optional(),
});

const idParamSchema = z.object({ id: objectId });

module.exports = {
  createAccessRequestSchema,
  idParamSchema,
  listAccessRequestsQuerySchema,
  updateAccessRequestStatusSchema,
};

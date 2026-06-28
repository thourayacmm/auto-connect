const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");

const pictogramBodySchema = z.object({
  name: z.string().min(2).max(120),
  imageUrl: z.string().url(),
  audioUrl: z.string().url().optional(),
  category: objectId,
  keywords: z.array(z.string()).optional(),
  level: z.string().max(60).optional(),
  ageMin: z.number().int().min(2).max(25).optional(),
  ageMax: z.number().int().min(2).max(25).optional(),
  icon: z.string().trim().min(1).max(80).optional(),
  subcategory: z.string().trim().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

const validateAgeRange = (payload) => !payload.ageMin || !payload.ageMax || payload.ageMin <= payload.ageMax;
const ageRangeMessage = { message: "ageMin must be lower than or equal to ageMax" };

const createPictogramSchema = pictogramBodySchema.refine(validateAgeRange, ageRangeMessage);
const updatePictogramSchema = pictogramBodySchema.partial().refine(validateAgeRange, ageRangeMessage);
const idParamSchema = z.object({ id: objectId });
const categoryParamSchema = z.object({ categoryId: objectId });

const listPictogramsQuerySchema = paginationQuerySchema.extend({
  category: objectId.optional(),
  level: z.string().optional(),
  age: z.coerce.number().int().min(2).max(25).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  search: z.string().optional(),
});

module.exports = {
  createPictogramSchema,
  updatePictogramSchema,
  idParamSchema,
  categoryParamSchema,
  listPictogramsQuerySchema,
};

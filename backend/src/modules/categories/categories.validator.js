const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");

const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  icon: z.string().max(80).optional(),
  color: z.string().max(16).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const updateCategorySchema = createCategorySchema.partial();
const idParamSchema = z.object({ id: objectId });
const listCategoriesQuerySchema = paginationQuerySchema.extend({
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

module.exports = { createCategorySchema, updateCategorySchema, idParamSchema, listCategoriesQuerySchema };

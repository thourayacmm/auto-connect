const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");

const scenarioBodySchema = z.object({
  title: z.string().min(2).max(150),
  description: z.string().max(1000).optional(),
  ageTarget: z.string().max(80).optional(),
  childGoal: z.string().max(1000).optional(),
  blockageHelp: z.string().max(1000).optional(),
  steps: z.array(z.string().min(1).max(220)).optional(),
  targetLevel: z.string().max(60).optional(),
  ageMin: z.number().int().min(2).max(25).optional(),
  ageMax: z.number().int().min(2).max(25).optional(),
  category: objectId.optional().nullable(),
  pictogramSequence: z.array(objectId).optional(),
  assignedKids: z.array(objectId).optional(),
  estimatedDuration: z.number().int().min(1).max(240).optional(),
  isActive: z.boolean().optional(),
});

const validateAgeRange = (payload) => !payload.ageMin || !payload.ageMax || payload.ageMin <= payload.ageMax;
const ageRangeMessage = { message: "ageMin must be lower than or equal to ageMax" };

const createScenarioSchema = scenarioBodySchema.refine(validateAgeRange, ageRangeMessage);
const updateScenarioSchema = scenarioBodySchema.partial().refine(validateAgeRange, ageRangeMessage);
const idParamSchema = z.object({ id: objectId });
const assignKidSchema = z.object({ kidId: objectId });

const listScenariosQuerySchema = paginationQuerySchema.extend({
  targetLevel: z.string().optional(),
  kidId: objectId.optional(),
  age: z.coerce.number().int().min(2).max(25).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

module.exports = {
  createScenarioSchema,
  updateScenarioSchema,
  idParamSchema,
  assignKidSchema,
  listScenariosQuerySchema,
};

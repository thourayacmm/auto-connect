const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");

const createKidSchema = z.object({
  firstName: z.string().trim().min(2, "Le prenom doit contenir au moins 2 caracteres.").max(80, "Le prenom est trop long."),
  lastName: z.string().trim().min(2, "Le nom doit contenir au moins 2 caracteres.").max(80, "Le nom est trop long."),
  age: z.coerce.number().int("L'age doit etre un nombre entier.").min(2, "L'age minimum autorise est 2 ans.").max(25, "L'age maximum autorise est 25 ans."),
  gender: z.enum(["M", "F", "other"]).default("other"),
  communicationLevel: z.string().trim().min(2, "Le niveau de communication est requis.").max(80, "Le niveau de communication est trop long."),
  difficultyType: z.string().trim().min(2, "Le type de difficulte est requis.").max(120, "Le type de difficulte est trop long."),
  preferences: z.array(z.string()).optional(),
  currentLevel: z.string().trim().max(60, "Le niveau actuel est trop long.").optional(),
  notes: z.string().optional(),
  status: z.enum(["active", "paused", "archived"]).optional(),
  sessionAccessCode: z.string().trim().min(4, "Le code enfant doit contenir au moins 4 caracteres.").max(20, "Le code enfant est trop long.").optional(),
  trackingPreferences: z
    .object({
      difficulty: z.string().max(30).optional(),
      recommendationFrequency: z.string().max(30).optional(),
      assignedScenariosMode: z.string().max(30).optional(),
      visualTheme: z.string().max(40).optional(),
      language: z.string().max(10).optional(),
      gridSize: z.string().max(20).optional(),
      childTheme: z.string().max(30).optional(),
      childVoice: z.string().max(10).optional(),
      childPictogramSize: z.string().max(10).optional(),
      childSuggestions: z.string().max(10).optional(),
      childLevel: z.string().max(40).optional(),
    })
    .optional(),
});

const updateKidSchema = createKidSchema.partial();

const listKidsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["active", "paused", "archived"]).optional(),
  search: z.string().optional(),
});

const idParamSchema = z.object({ id: objectId });

const assignUserSchema = z.object({
  userId: objectId,
});

const progressQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

module.exports = {
  createKidSchema,
  updateKidSchema,
  listKidsQuerySchema,
  idParamSchema,
  assignUserSchema,
  progressQuerySchema,
};

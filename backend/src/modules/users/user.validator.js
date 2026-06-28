const { z, objectId, paginationQuerySchema } = require("../../validators/common.validators");
const { ROLES } = require("../../constants/roles");

const createUserSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(Object.values(ROLES)),
  language: z.string().max(10).optional(),
  phone: z.string().max(32).optional(),
  address: z.string().max(240).optional(),
  specialty: z.string().max(120).optional(),
  avatar: z.string().url().optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true });

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

const listUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(Object.values(ROLES)).optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

const idParamSchema = z.object({ id: objectId });

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateStatusSchema,
  listUsersQuerySchema,
  idParamSchema,
};

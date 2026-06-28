const { z } = require("../../validators/common.validators");
const { ROLES } = require("../../constants/roles");

const registerSchema = z.object({
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum([ROLES.PARENT, ROLES.THERAPIST, ROLES.ADMIN]).default(ROLES.PARENT),
  language: z.string().max(10).optional(),
  phone: z.string().max(32).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const childSessionSchema = z.object({
  accessCode: z.string().min(4).max(20),
});

module.exports = { registerSchema, loginSchema, childSessionSchema };

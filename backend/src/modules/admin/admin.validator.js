const { z } = require("../../validators/common.validators");
const { ROLES } = require("../../constants/roles");

const updateAccessControlSchema = z.object({
  entries: z.array(
    z.object({
      role: z.enum(Object.values(ROLES)),
      resource: z.string().min(1),
      actions: z.array(z.string()),
    }),
  ),
});

module.exports = { updateAccessControlSchema };

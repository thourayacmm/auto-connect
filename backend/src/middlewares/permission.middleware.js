const { AccessControl } = require("../modules/access-control/accessControl.model");
const { roleDefaultPermissions } = require("../constants/default-access");
const { ApiError } = require("../utils/ApiError");

const hasRolePermission = async (role, resource, permission) => {
  const entry = await AccessControl.findOne({ role, resource }).select("actions").lean();
  if (entry) {
    const configuredActions = Array.isArray(entry.actions) ? entry.actions : [];
    return configuredActions.includes(permission);
  }

  return (roleDefaultPermissions[role] || []).includes(permission);
};

const authorizePermission =
  (resource, permission) =>
  async (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    try {
      const allowed = await hasRolePermission(req.user.role, resource, permission);
      if (!allowed) {
        return next(new ApiError(403, `Missing permission: ${permission}`));
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };

module.exports = { authorizePermission };

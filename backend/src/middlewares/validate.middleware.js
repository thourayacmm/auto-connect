const { ApiError } = require("../utils/ApiError");

const buildValidationMessage = (flattenedError) => {
  if (!flattenedError) {
    return "Validation error";
  }

  const formError = flattenedError.formErrors?.[0];
  if (formError) {
    return formError;
  }

  const firstField = Object.keys(flattenedError.fieldErrors || {}).find(
    (field) => Array.isArray(flattenedError.fieldErrors[field]) && flattenedError.fieldErrors[field].length,
  );

  if (!firstField) {
    return "Validation error";
  }

  return flattenedError.fieldErrors[firstField][0] || "Validation error";
};

const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const flattenedError = result.error.flatten();
    return next(new ApiError(400, buildValidationMessage(flattenedError), flattenedError));
  }
  req[source] = result.data;
  return next();
};

module.exports = { validate };

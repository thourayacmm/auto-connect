const { ApiError } = require("../utils/ApiError");
const { errorResponse } = require("../utils/apiResponse");

const notFoundMiddleware = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

const errorMiddleware = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  const details = err.details || null;

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return errorResponse(res, { statusCode, message, details });
};

module.exports = { notFoundMiddleware, errorMiddleware };

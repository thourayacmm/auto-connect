const successResponse = (res, { statusCode = 200, message = "OK", data = null, meta = null }) => {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

const errorResponse = (res, { statusCode = 500, message = "Server error", details = null }) => {
  const body = { success: false, message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};

module.exports = { successResponse, errorResponse };

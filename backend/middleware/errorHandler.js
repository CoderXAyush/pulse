const { nodeEnv } = require("../config/env");

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  // Keep responses clean in production, detailed in development.
  const response = {
    status: err.status || "error",
    message,
  };

  if (nodeEnv === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;

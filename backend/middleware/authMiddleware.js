const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { jwtSecret } = require("../config/env");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      organizationId: decoded.organizationId,
    };
    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", 401));
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to access this resource", 403));
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
};

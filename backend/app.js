const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const videoRoutes = require("./routes/videoRoutes");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Enable cross-origin requests
app.use(cors());

// API routes
app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api", videoRoutes);

// Handle unknown routes
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Centralized error middleware (must be last)
app.use(errorHandler);

module.exports = app;

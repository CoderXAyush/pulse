const dotenv = require("dotenv");

// Load variables from .env into process.env
dotenv.config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5001,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pulse_db",
  jwtSecret: process.env.JWT_SECRET || "change-this-in-production",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
};

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false, // Never return password unless explicitly requested.
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    default: "local",
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    enum: ["viewer", "editor", "admin"],
    default: "viewer",
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);

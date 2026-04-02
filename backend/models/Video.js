const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  filename: {
    type: String,
    required: true,
  },
  filepath: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  format: {
    type: String,
    trim: true,
    default: "",
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true,
  },
  streamingReady: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["uploaded", "processing", "completed"],
    default: "uploaded",
  },
  result: {
    type: String,
    enum: ["safe", "flagged"],
    default: "safe",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Video", videoSchema);

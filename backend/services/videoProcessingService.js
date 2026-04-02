const Video = require("../models/Video");
const { getIO } = require("../sockets");

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectResultFromFilename(filename = "") {
  return filename.toLowerCase().includes("violence") ? "flagged" : "safe";
}

async function emitProgress(videoId, organizationId, progress, stage) {
  if (!organizationId) {
    return;
  }
  const io = getIO();
  io.to(`org:${organizationId}`).emit("processingProgress", {
    videoId: String(videoId),
    progress,
    stage,
  });
}

async function processVideo(videoId) {
  const existing = await Video.findById(videoId);
  if (!existing) {
    return;
  }

  const organizationId = String(existing.organizationId);

  await Video.findByIdAndUpdate(videoId, { status: "processing" });

  const stages = [
    { stage: "validation", progress: 10, waitMs: 800 },
    { stage: "storage", progress: 25, waitMs: 400 },
    { stage: "sensitivity", progress: 50, waitMs: 1200 },
    { stage: "streaming_prep", progress: 85, waitMs: 1000 },
    { stage: "finalizing", progress: 100, waitMs: 700 },
  ];

  for (const item of stages) {
    await delay(item.waitMs);
    await emitProgress(videoId, organizationId, item.progress, item.stage);
  }

  const video = await Video.findById(videoId);
  if (!video) {
    return;
  }

  const result = detectResultFromFilename(video.filename);

  await Video.findByIdAndUpdate(videoId, {
    status: "completed",
    result,
    streamingReady: true,
    processedAt: new Date(),
  });
}

module.exports = {
  processVideo,
};

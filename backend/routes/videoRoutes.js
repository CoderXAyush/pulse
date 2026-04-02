const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { uploadSingleVideo } = require("../middleware/uploadMiddleware");
const { uploadVideo, getVideos, getVideoById, streamVideo, deleteVideo } = require("../controllers/videoController");

const router = express.Router();

router.post(
  "/videos/upload",
  requireAuth,
  requireRole(["editor", "admin"]),
  uploadSingleVideo,
  uploadVideo
);
router.get("/videos", requireAuth, getVideos);
router.get("/videos/stream/:id", requireAuth, streamVideo);
router.delete(
  "/videos/:id",
  requireAuth,
  requireRole(["editor", "admin"]),
  deleteVideo
);
router.get("/videos/:id", requireAuth, getVideoById);

module.exports = router;

const path = require("path");
const Video = require("../models/Video");
const AppError = require("../utils/AppError");
const { processVideo } = require("../services/videoProcessingService");
const fs = require("fs");

const MIME_BY_FORMAT = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
};

function ensureVideoAccess(video, user) {
  if (!user.organizationId || String(video.organizationId) !== String(user.organizationId)) {
    throw new AppError("You do not have permission to access this video", 403);
  }
}

function ensureCanDeleteVideo(video, user) {
  ensureVideoAccess(video, user);
  if (user.role === "admin") {
    return;
  }
  if (user.role === "editor" && String(video.userId) === String(user.userId)) {
    return;
  }
  throw new AppError("You do not have permission to delete this video", 403);
}

function streamContentType(format) {
  const key = (format || "").toLowerCase();
  return MIME_BY_FORMAT[key] || "video/mp4";
}

async function uploadVideo(req, res, next) {
  try {
    const { title, description = "" } = req.body;

    if (!req.user.organizationId) {
      return next(new AppError("Organization context is required", 400));
    }

    if (!title) {
      return next(new AppError("title is required", 400));
    }

    if (!req.file) {
      return next(new AppError("video file is required", 400));
    }

    const format = path.extname(req.file.originalname).toLowerCase().replace(/^\./, "") || "unknown";

    const video = await Video.create({
      title,
      description,
      filename: req.file.filename,
      filepath: req.file.path,
      size: req.file.size,
      format,
      organizationId: req.user.organizationId,
      status: "processing",
      userId: req.user.userId,
    });

    res.status(201).json({
      status: "success",
      video: {
        id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        filepath: video.filepath,
        size: video.size,
        format: video.format,
        status: video.status,
        result: video.result,
        userId: video.userId,
        organizationId: video.organizationId,
        createdAt: video.createdAt,
      },
    });

    processVideo(video._id).catch((error) => {
      console.error("Background video processing failed:", error.message);
    });
  } catch (error) {
    next(error);
  }
}

async function getVideos(req, res, next) {
  try {
    if (!req.user.organizationId) {
      return next(new AppError("Organization context is required", 400));
    }

    const { status, result } = req.query;
    const query = { organizationId: req.user.organizationId };

    if (status) {
      query.status = status;
    }

    if (result) {
      query.result = result;
    }

    const videos = await Video.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      count: videos.length,
      videos,
    });
  } catch (error) {
    next(error);
  }
}

async function getVideoById(req, res, next) {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return next(new AppError("Video not found", 404));
    }

    ensureVideoAccess(video, req.user);

    res.status(200).json({
      status: "success",
      video,
    });
  } catch (error) {
    next(error);
  }
}

async function streamVideo(req, res, next) {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return next(new AppError("Video not found", 404));
    }

    ensureVideoAccess(video, req.user);

    const absolutePath = path.resolve(video.filepath);
    if (!fs.existsSync(absolutePath)) {
      return next(new AppError("Video file not found on server", 404));
    }

    const fileSize = fs.statSync(absolutePath).size;
    const range = req.headers.range;
    const contentType = streamContentType(video.format);

    if (!range) {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });

      fs.createReadStream(absolutePath).pipe(res);
      return;
    }

    const matches = range.match(/bytes=(\d*)-(\d*)/);
    if (!matches) {
      return next(new AppError("Invalid range header", 416));
    }

    const start = matches[1] ? Number(matches[1]) : 0;
    const end = matches[2] ? Number(matches[2]) : fileSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
      res.setHeader("Content-Range", `bytes */${fileSize}`);
      return next(new AppError("Requested range not satisfiable", 416));
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(absolutePath, { start, end });

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": contentType,
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

async function deleteVideo(req, res, next) {
  try {
    const { id } = req.params;
    const video = await Video.findById(id);

    if (!video) {
      return next(new AppError("Video not found", 404));
    }

    ensureCanDeleteVideo(video, req.user);

    const absolutePath = path.resolve(video.filepath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await Video.findByIdAndDelete(id);

    res.status(200).json({
      status: "success",
      message: "Video deleted",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadVideo,
  getVideos,
  getVideoById,
  streamVideo,
  deleteVideo,
};

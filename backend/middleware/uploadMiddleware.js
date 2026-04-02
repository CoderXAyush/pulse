const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");

const allowedMimeTypes = ["video/mp4", "video/quicktime", "video/x-msvideo"];
const allowedExtensions = [".mp4", ".mov", ".avi"];

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${safeOriginalName}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimeTypes.includes(file.mimetype);
  const isValidExt = allowedExtensions.includes(ext);

  if (!isValidMime || !isValidExt) {
    return cb(new AppError("Only mp4, mov and avi video files are allowed", 400));
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

function uploadSingleVideo(req, res, next) {
  upload.single("video")(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File too large. Max allowed size is 100MB", 400));
    }

    return next(err);
  });
}

module.exports = {
  uploadSingleVideo,
};

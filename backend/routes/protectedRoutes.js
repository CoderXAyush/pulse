const express = require("express");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

// Accessible by any authenticated user.
router.get("/protected", requireAuth, (req, res) => {
  res.status(200).json({
    status: "success",
    message: "You are authenticated",
    user: req.user,
  });
});

// Accessible only by admin users.
router.get("/admin", requireAuth, requireRole(["admin"]), (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Admin access granted",
  });
});

// List users in the same organization (admin only).
router.get("/organization/users", requireAuth, requireRole(["admin"]), async (req, res, next) => {
  try {
    if (!req.user.organizationId) {
      return res.status(400).json({ status: "error", message: "Organization context is required" });
    }
    const users = await User.find({ organizationId: req.user.organizationId })
      .select("name email role createdAt")
      .sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

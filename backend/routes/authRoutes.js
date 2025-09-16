const express = require("express");
const {
  register,
  login,
  getMe,
  updateProfile,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middlreware/auth");

const router = express.Router();

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================

// POST /api/auth/register - Register new user
router.post("/register", register);

// POST /api/auth/login - Login user
router.post("/login", login);

// ===========================================
// PROTECTED ROUTES (Authentication required)
// ===========================================

// GET /api/auth/me - Get current user info
router.get("/me", protect, getMe);

// PUT /api/auth/profile - Update user profile
router.put("/profile", protect, updateProfile);

// POST /api/auth/logout - Logout user
router.post("/logout", protect, logout);

module.exports = router;

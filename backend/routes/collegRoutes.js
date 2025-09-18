const express = require("express");
const {
  getAllColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  getCollegeStats,
  searchColleges,
  getMyCollege,
} = require("../controllers/collegeController");

const { protect, authorize, optionalAuth } = require("../middlreware/auth");

const router = express.Router();

// ===========================================
// PUBLIC ROUTES (No authentication required)
// ===========================================

// GET /api/colleges - Get all colleges (for registration dropdown)
router.get("/", optionalAuth, getAllColleges);

// GET /api/colleges/search - Search colleges (for autocomplete)
router.get("/search", searchColleges);

// GET /api/colleges/:id - Get single college by ID
router.get("/:id", optionalAuth, getCollegeById);

// ===========================================
// PROTECTED ROUTES (Authentication required)
// ===========================================

// GET /api/colleges/my/info - Get current user's college info
router.get("/my/info", protect, getMyCollege);

// ===========================================
// ADMIN ONLY ROUTES
// ===========================================

// GET /api/colleges/admin/stats - Get college statistics (Admin only)
router.get("/admin/stats", protect, authorize("admin"), getCollegeStats);

// POST /api/colleges - Create new college (Admin only)
router.post("/", protect, authorize("admin"), createCollege);

// PUT /api/colleges/:id - Update college (Admin only)
router.put("/:id", protect, authorize("admin"), updateCollege);

// DELETE /api/colleges/:id - Delete college (Admin only)
router.delete("/:id", protect, authorize("admin"), deleteCollege);

module.exports = router;

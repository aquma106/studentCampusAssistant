const express = require("express");
const {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  markAsResolved,
  getMyQuestions,
} = require("../controllers/questionController");

const { protect, sameCollege } = require("../middlreware/auth");

const router = express.Router();

// ===========================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ===========================================

// Apply authentication to all routes
router.use(protect);

// Apply college filter to all routes (users only see their college's content)
router.use(sameCollege);

// ===========================================
// QUESTION ROUTES
// ===========================================

// GET /api/questions - Get all questions (with filtering, search, pagination)
router.get("/", getQuestions);

// POST /api/questions - Create new question
router.post("/", createQuestion);

// GET /api/questions/my - Get questions asked by current user
router.get("/my", getMyQuestions);

// GET /api/questions/:id - Get single question by ID
router.get("/:id", getQuestionById);

// PUT /api/questions/:id - Update question (only by author)
router.put("/:id", updateQuestion);

// DELETE /api/questions/:id - Delete question (only by author)
router.delete("/:id", deleteQuestion);

// POST /api/questions/:id/resolve - Mark question as resolved (only by author)
router.post("/:id/resolve", markAsResolved);

module.exports = router;

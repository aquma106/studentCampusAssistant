const express = require("express");
const {
  createAnswer,
  getAnswersForQuestion,
  updateAnswer,
  deleteAnswer,
  markAsHelpful,
  removeHelpfulMark,
  setAsBestAnswer,
  getMyAnswers,
} = require("../controllers/answerController");

const { protect, sameCollege } = require("../middlreware/auth");

const router = express.Router();

// ===========================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ===========================================

// Apply authentication to all routes
router.use(protect);

// Apply college filter to all routes
router.use(sameCollege);

// ===========================================
// ANSWER ROUTES
// ===========================================

// GET /api/answers/my - Get answers given by current user
router.get("/my", getMyAnswers);

// POST /api/answers/question/:questionId - Create new answer for a question
router.post("/question/:questionId", createAnswer);

// GET /api/answers/question/:questionId - Get all answers for a question
router.get("/question/:questionId", getAnswersForQuestion);

// PUT /api/answers/:id - Update answer (only by author)
router.put("/:id", updateAnswer);

// DELETE /api/answers/:id - Delete answer (only by author)
router.delete("/:id", deleteAnswer);

// POST /api/answers/:id/helpful - Mark answer as helpful
router.post("/:id/helpful", markAsHelpful);

// DELETE /api/answers/:id/helpful - Remove helpful mark
router.delete("/:id/helpful", removeHelpfulMark);

// POST /api/answers/:id/best - Set as best answer (only by question author)
router.post("/:id/best", setAsBestAnswer);

module.exports = router;

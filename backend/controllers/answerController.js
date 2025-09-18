const Answer = require("../models/Answer");
const Question = require("../models/Question");
const User = require("../models/User");

// ===========================================
// CREATE NEW ANSWER
// ===========================================

const createAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, images } = req.body;

    // 1. Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answer content is required",
      });
    }

    // 2. Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // 3. Check if question belongs to user's college
    if (question.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Question not from your college.",
      });
    }

    // 4. Check if question is already resolved (optional - you can allow answers to resolved questions)
    // if (question.isResolved) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Cannot answer resolved questions'
    //   });
    // }

    // 5. Create answer
    const answer = new Answer({
      content: content.trim(),
      author: req.user.userId,
      question: questionId,
      images: images || [],
    });

    await answer.save();

    // 6. Add answer to question's answers array
    await Question.findByIdAndUpdate(questionId, {
      $push: { answers: answer._id },
    });

    // 7. Update user's answer count
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { "stats.answersGiven": 1 },
    });

    // 8. Populate author info for response
    await answer.populate("author", "name role department year avatar stats");

    res.status(201).json({
      success: true,
      message: "Answer created successfully",
      answer,
    });
  } catch (error) {
    console.error("Create answer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating answer",
      error: error.message,
    });
  }
};

// ===========================================
// GET ALL ANSWERS FOR A QUESTION
// ===========================================

const getAnswersForQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // 1. Check if question exists and belongs to user's college
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (question.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Question not from your college.",
      });
    }

    // 2. Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Always show best answer first if it exists
    if (question.bestAnswer) {
      sort.isBestAnswer = -1;
    }

    // 3. Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Get answers with pagination
    const answers = await Answer.find({
      question: questionId,
      isActive: true,
    })
      .populate("author", "name role department year avatar stats")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // 5. Get total count for pagination
    const totalAnswers = await Answer.countDocuments({
      question: questionId,
      isActive: true,
    });
    const totalPages = Math.ceil(totalAnswers / parseInt(limit));

    res.status(200).json({
      success: true,
      answers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalAnswers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get answers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching answers",
      error: error.message,
    });
  }
};

// ===========================================
// UPDATE ANSWER (Only by author)
// ===========================================

const updateAnswer = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, images } = req.body;

    // 1. Validate content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Answer content is required",
      });
    }

    // 2. Find answer
    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // 3. Check if user is the author
    if (answer.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own answers.",
      });
    }

    // 4. Update answer
    const updatedAnswer = await Answer.findByIdAndUpdate(
      id,
      {
        content: content.trim(),
        images: images || answer.images,
      },
      { new: true, runValidators: true }
    ).populate("author", "name role department year avatar stats");

    res.status(200).json({
      success: true,
      message: "Answer updated successfully",
      answer: updatedAnswer,
    });
  } catch (error) {
    console.error("Update answer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating answer",
      error: error.message,
    });
  }
};

// ===========================================
// DELETE ANSWER (Only by author)
// ===========================================

const deleteAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find answer
    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // 2. Check if user is the author
    if (answer.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own answers.",
      });
    }

    // 3. Check if this is the best answer
    if (answer.isBestAnswer) {
      // Remove best answer from question
      await Question.findByIdAndUpdate(answer.question, {
        $unset: { bestAnswer: 1 },
        isResolved: false,
      });
    }

    // 4. Remove answer from question's answers array
    await Question.findByIdAndUpdate(answer.question, {
      $pull: { answers: answer._id },
    });

    // 5. Delete answer
    await Answer.findByIdAndDelete(id);

    // 6. Update user's answer count
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { "stats.answersGiven": -1 },
    });

    res.status(200).json({
      success: true,
      message: "Answer deleted successfully",
    });
  } catch (error) {
    console.error("Delete answer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting answer",
      error: error.message,
    });
  }
};

// ===========================================
// MARK ANSWER AS HELPFUL
// ===========================================

const markAsHelpful = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find answer
    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // 2. Check if answer belongs to a question from user's college
    const question = await Question.findById(answer.question);
    if (question.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Answer not from your college.",
      });
    }

    // 3. Check if user is trying to mark their own answer as helpful
    if (answer.author.toString() === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot mark your own answer as helpful",
      });
    }

    // 4. Mark as helpful
    const result = await answer.markAsHelpful(req.user.userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      helpfulCount: answer.helpfulCount,
    });
  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking answer as helpful",
      error: error.message,
    });
  }
};

// ===========================================
// REMOVE HELPFUL MARK
// ===========================================

const removeHelpfulMark = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find answer
    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // 2. Remove helpful mark
    const result = await answer.removeHelpfulMark(req.user.userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      helpfulCount: answer.helpfulCount,
    });
  } catch (error) {
    console.error("Remove helpful mark error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while removing helpful mark",
      error: error.message,
    });
  }
};

// ===========================================
// SET AS BEST ANSWER (Only by question author)
// ===========================================

const setAsBestAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find answer
    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: "Answer not found",
      });
    }

    // 2. Find the question and check if current user is the author
    const question = await Question.findById(answer.question);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    if (question.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only question author can select best answer.",
      });
    }

    // 3. Remove best answer status from other answers to same question
    await Answer.updateMany(
      { question: answer.question, _id: { $ne: answer._id } },
      { isBestAnswer: false }
    );

    // 4. Set this answer as best answer
    answer.isBestAnswer = true;
    await answer.save();

    // 5. Update the question to mark it as resolved with this best answer
    await Question.findByIdAndUpdate(answer.question, {
      bestAnswer: answer._id,
      isResolved: true,
    });

    // 6. Update the answer author's best answers count
    await User.findByIdAndUpdate(answer.author, {
      $inc: { "stats.bestAnswersCount": 1 },
    });

    // 7. If there was a previous best answer, decrement that author's count
    if (
      question.bestAnswer &&
      question.bestAnswer.toString() !== answer._id.toString()
    ) {
      const prevBestAnswer = await Answer.findById(question.bestAnswer);
      if (prevBestAnswer) {
        await User.findByIdAndUpdate(prevBestAnswer.author, {
          $inc: { "stats.bestAnswersCount": -1 },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Answer set as best answer successfully",
    });
  } catch (error) {
    console.error("Set best answer error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while setting best answer",
      error: error.message,
    });
  }
};

// ===========================================
// GET MY ANSWERS (Answers given by current user)
// ===========================================

const getMyAnswers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const answers = await Answer.find({
      author: req.user.userId,
      isActive: true,
    })
      .populate("question", "title category isResolved")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAnswers = await Answer.countDocuments({
      author: req.user.userId,
      isActive: true,
    });
    const totalPages = Math.ceil(totalAnswers / parseInt(limit));

    res.status(200).json({
      success: true,
      answers,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalAnswers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get my answers error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your answers",
      error: error.message,
    });
  }
};

module.exports = {
  createAnswer,
  getAnswersForQuestion,
  updateAnswer,
  deleteAnswer,
  markAsHelpful,
  removeHelpfulMark,
  setAsBestAnswer,
  getMyAnswers,
};

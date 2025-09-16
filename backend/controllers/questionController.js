const Question = require("../models/Question");
const User = require("../models/User");
const College = require("../models/College");

// ===========================================
// CREATE NEW QUESTION
// ===========================================

const createQuestion = async (req, res) => {
  try {
    const {
      title,
      content,
      category,
      tags,
      images,
      lostFoundDetails,
      roommateDetails,
    } = req.body;

    // 1. Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, content, and category",
      });
    }

    // 2. Validate category
    const validCategories = [
      "lost-and-found",
      "roommate",
      "academic-help",
      "campus-info",
      "general",
      "events",
      "career",
      "hostel",
      "transport",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category provided",
      });
    }

    // 3. Create question object
    const questionData = {
      title,
      content,
      category,
      author: req.user.userId,
      college: req.user.college._id,
      tags: tags || [],
      images: images || [],
    };

    // 4. Add category-specific details
    if (category === "lost-and-found" && lostFoundDetails) {
      questionData.lostFoundDetails = lostFoundDetails;
    }

    if (category === "roommate" && roommateDetails) {
      questionData.roommateDetails = roommateDetails;
    }

    // 5. Create and save question
    const question = new Question(questionData);
    await question.save();

    // 6. Update user's question count
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { "stats.questionsAsked": 1 },
    });

    // 7. Update college's question count
    await College.findByIdAndUpdate(req.user.college._id, {
      $inc: { totalQuestions: 1 },
    });

    // 8. Populate author and college info for response
    await question.populate("author", "name role department year avatar");
    await question.populate("college", "name location");

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      question,
    });
  } catch (error) {
    console.error("Create question error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating question",
      error: error.message,
    });
  }
};

// ===========================================
// GET ALL QUESTIONS (College-specific)
// ===========================================

const getQuestions = async (req, res) => {
  try {
    const {
      category,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // 1. Build filter object
    const filter = {
      college: req.user.college._id, // Only show questions from user's college
    };

    // Add category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // 2. Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // 3. Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Get questions with pagination
    const questions = await Question.find(filter)
      .populate("author", "name role department year avatar stats")
      .populate("college", "name location")
      .populate("bestAnswer")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // 5. Get total count for pagination
    const totalQuestions = await Question.countDocuments(filter);
    const totalPages = Math.ceil(totalQuestions / parseInt(limit));

    res.status(200).json({
      success: true,
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalQuestions,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get questions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching questions",
      error: error.message,
    });
  }
};

// ===========================================
// GET SINGLE QUESTION BY ID
// ===========================================

const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find question and populate related data
    const question = await Question.findById(id)
      .populate("author", "name role department year avatar stats bio")
      .populate("college", "name location")
      .populate({
        path: "answers",
        populate: {
          path: "author",
          select: "name role department year avatar stats",
        },
      })
      .populate("bestAnswer");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // 2. Check if question belongs to user's college
    if (question.college._id.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Question not from your college.",
      });
    }

    // 3. Increment view count (only if not the author viewing)
    if (question.author._id.toString() !== req.user.userId.toString()) {
      await question.incrementViews();
    }

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Get question by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching question",
      error: error.message,
    });
  }
};

// ===========================================
// UPDATE QUESTION (Only by author)
// ===========================================

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, images, lostFoundDetails, roommateDetails } =
      req.body;

    // 1. Find question
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // 2. Check if user is the author
    if (question.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own questions.",
      });
    }

    // 3. Update allowed fields
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (tags) updateData.tags = tags;
    if (images) updateData.images = images;

    // Update category-specific details
    if (lostFoundDetails && question.category === "lost-and-found") {
      updateData.lostFoundDetails = lostFoundDetails;
    }

    if (roommateDetails && question.category === "roommate") {
      updateData.roommateDetails = roommateDetails;
    }

    // 4. Update question
    const updatedQuestion = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("author", "name role department year avatar");

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question: updatedQuestion,
    });
  } catch (error) {
    console.error("Update question error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating question",
      error: error.message,
    });
  }
};

// ===========================================
// DELETE QUESTION (Only by author)
// ===========================================

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find question
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // 2. Check if user is the author
    if (question.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own questions.",
      });
    }

    // 3. Delete question
    await Question.findByIdAndDelete(id);

    // 4. Update user's question count
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { "stats.questionsAsked": -1 },
    });

    // 5. Update college's question count
    await College.findByIdAndUpdate(req.user.college._id, {
      $inc: { totalQuestions: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Delete question error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting question",
      error: error.message,
    });
  }
};

// ===========================================
// MARK QUESTION AS RESOLVED (Only by author)
// ===========================================

const markAsResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const { bestAnswerId } = req.body;

    // 1. Find question
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // 2. Check if user is the author
    if (question.author.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only question author can mark as resolved.",
      });
    }

    // 3. Mark as resolved
    await question.markAsResolved(bestAnswerId);

    res.status(200).json({
      success: true,
      message: "Question marked as resolved",
      question,
    });
  } catch (error) {
    console.error("Mark resolved error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking question as resolved",
      error: error.message,
    });
  }
};

// ===========================================
// GET MY QUESTIONS (Questions asked by current user)
// ===========================================

const getMyQuestions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const questions = await Question.find({ author: req.user.userId })
      .populate("college", "name location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalQuestions = await Question.countDocuments({
      author: req.user.userId,
    });
    const totalPages = Math.ceil(totalQuestions / parseInt(limit));

    res.status(200).json({
      success: true,
      questions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalQuestions,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get my questions error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your questions",
      error: error.message,
    });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  markAsResolved,
  getMyQuestions,
};

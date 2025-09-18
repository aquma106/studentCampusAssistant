const College = require("../models/College");
const User = require("../models/User");
const Question = require("../models/Question");

// ===========================================
// GET ALL COLLEGES (For registration dropdown)
// ===========================================

const getAllColleges = async (req, res) => {
  try {
    const {
      search,
      state,
      country,
      isActive,
      page = 1,
      limit = 50,
    } = req.query;

    // 1. Build filter object
    const filter = {};

    // Fix the isActive filter logic
    if (isActive !== undefined && isActive !== "all") {
      filter.isActive = isActive === "true" || isActive === true;
    } else if (isActive === undefined) {
      // If no isActive parameter is provided, show only active colleges by default
      filter.isActive = true;
    }

    if (state) {
      filter["location.state"] = { $regex: state, $options: "i" };
    }

    if (country) {
      filter["location.country"] = { $regex: country, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { emailDomain: { $regex: search, $options: "i" } },
        { "location.city": { $regex: search, $options: "i" } },
      ];
    }

    // 2. Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 3. Get colleges with pagination
    const colleges = await College.find(filter)
      .select("name emailDomain location isActive totalStudents totalQuestions")
      .sort({ totalStudents: -1, name: 1 }) // Popular colleges first, then alphabetically
      .skip(skip)
      .limit(parseInt(limit));

    // 4. Get total count for pagination
    const totalColleges = await College.countDocuments(filter);
    const totalPages = Math.ceil(totalColleges / parseInt(limit));

    res.status(200).json({
      success: true,
      colleges,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalColleges,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get colleges error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching colleges",
      error: error.message,
    });
  }
};

// ===========================================
// GET SINGLE COLLEGE BY ID
// ===========================================

const getCollegeById = async (req, res) => {
  try {
    const { id } = req.params;

    const college = await College.findById(id);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    // Get additional statistics
    const stats = await Promise.all([
      User.countDocuments({ college: id, isActive: true }),
      Question.countDocuments({ college: id }),
      User.countDocuments({ college: id, role: "faculty", isActive: true }),
    ]);

    const collegeData = {
      ...college.toObject(),
      stats: {
        activeStudents: stats[0],
        totalQuestions: stats[1],
        facultyMembers: stats[2],
      },
    };

    res.status(200).json({
      success: true,
      college: collegeData,
    });
  } catch (error) {
    console.error("Get college by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching college",
      error: error.message,
    });
  }
};

// ===========================================
// CREATE NEW COLLEGE (Admin only)
// ===========================================

const createCollege = async (req, res) => {
  try {
    const { name, emailDomain, location } = req.body;

    // 1. Validate required fields
    if (
      !name ||
      !emailDomain ||
      !location ||
      !location.city ||
      !location.state ||
      !location.country
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: name, emailDomain, location (city, state, country)",
      });
    }

    // 2. Check if college with same name or email domain already exists
    const existingCollege = await College.findOne({
      $or: [
        { name: { $regex: `^${name}$`, $options: "i" } },
        { emailDomain: emailDomain.toLowerCase() },
      ],
    });

    if (existingCollege) {
      return res.status(400).json({
        success: false,
        message: "College with this name or email domain already exists",
      });
    }

    // 3. Create new college
    const college = new College({
      name: name.trim(),
      emailDomain: emailDomain.toLowerCase().trim(),
      location: {
        city: location.city.trim(),
        state: location.state.trim(),
        country: location.country.trim(),
      },
    });

    await college.save();

    res.status(201).json({
      success: true,
      message: "College created successfully",
      college,
    });
  } catch (error) {
    console.error("Create college error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating college",
      error: error.message,
    });
  }
};

// ===========================================
// UPDATE COLLEGE (Admin only)
// ===========================================

const updateCollege = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, emailDomain, location, isActive } = req.body;

    // 1. Find college
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    // 2. Check if new name or email domain conflicts with existing colleges
    if (name || emailDomain) {
      const conflictFilter = { _id: { $ne: id } };

      if (name && emailDomain) {
        conflictFilter.$or = [
          { name: { $regex: `^${name}$`, $options: "i" } },
          { emailDomain: emailDomain.toLowerCase() },
        ];
      } else if (name) {
        conflictFilter.name = { $regex: `^${name}$`, $options: "i" };
      } else if (emailDomain) {
        conflictFilter.emailDomain = emailDomain.toLowerCase();
      }

      const existingCollege = await College.findOne(conflictFilter);
      if (existingCollege) {
        return res.status(400).json({
          success: false,
          message:
            "Another college with this name or email domain already exists",
        });
      }
    }

    // 3. Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (emailDomain) updateData.emailDomain = emailDomain.toLowerCase().trim();
    if (location) updateData.location = location;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // 4. Update college
    const updatedCollege = await College.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "College updated successfully",
      college: updatedCollege,
    });
  } catch (error) {
    console.error("Update college error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating college",
      error: error.message,
    });
  }
};

// ===========================================
// DELETE COLLEGE (Admin only)
// ===========================================

const deleteCollege = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find college
    const college = await College.findById(id);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: "College not found",
      });
    }

    // 2. Check if college has active users
    const activeUsersCount = await User.countDocuments({
      college: id,
      isActive: true,
    });

    if (activeUsersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete college. It has ${activeUsersCount} active users. Please deactivate the college instead.`,
      });
    }

    // 3. Delete college
    await College.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "College deleted successfully",
    });
  } catch (error) {
    console.error("Delete college error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting college",
      error: error.message,
    });
  }
};

// ===========================================
// GET COLLEGE STATISTICS (Admin only)
// ===========================================

const getCollegeStats = async (req, res) => {
  try {
    // 1. Get overall statistics
    const [totalColleges, activeColleges, totalUsers, totalQuestions] =
      await Promise.all([
        College.countDocuments(),
        College.countDocuments({ isActive: true }),
        User.countDocuments({ isActive: true }),
        Question.countDocuments(),
      ]);

    // 2. Get top colleges by activity
    const topColleges = await College.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "college",
          as: "users",
        },
      },
      {
        $lookup: {
          from: "questions",
          localField: "_id",
          foreignField: "college",
          as: "questions",
        },
      },
      {
        $project: {
          name: 1,
          location: 1,
          emailDomain: 1,
          userCount: { $size: "$users" },
          questionCount: { $size: "$questions" },
          totalActivity: {
            $add: [{ $size: "$users" }, { $size: "$questions" }],
          },
        },
      },
      { $sort: { totalActivity: -1 } },
      { $limit: 10 },
    ]);

    // 3. Get colleges by location
    const collegesByLocation = await College.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$location.state",
          count: { $sum: 1 },
          colleges: { $push: { name: "$name", city: "$location.city" } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        overview: {
          totalColleges,
          activeColleges,
          totalUsers,
          totalQuestions,
        },
        topColleges,
        collegesByLocation,
      },
    });
  } catch (error) {
    console.error("Get college stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching statistics",
      error: error.message,
    });
  }
};

// ===========================================
// SEARCH COLLEGES (For autocomplete in registration)
// ===========================================

const searchColleges = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters long",
      });
    }

    const colleges = await College.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { emailDomain: { $regex: q, $options: "i" } },
        { "location.city": { $regex: q, $options: "i" } },
      ],
      isActive: true,
    })
      .select("name emailDomain location.city location.state totalStudents")
      .sort({ totalStudents: -1 }) // Popular colleges first
      .limit(20);

    res.status(200).json({
      success: true,
      colleges,
    });
  } catch (error) {
    console.error("Search colleges error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while searching colleges",
      error: error.message,
    });
  }
};

// ===========================================
// GET MY COLLEGE INFO (For logged-in users)
// ===========================================

const getMyCollege = async (req, res) => {
  try {
    const college = await College.findById(req.user.college._id);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: "Your college information not found",
      });
    }

    // Get college-specific statistics
    const [studentCount, facultyCount, questionCount] = await Promise.all([
      User.countDocuments({
        college: college._id,
        role: "student",
        isActive: true,
      }),
      User.countDocuments({
        college: college._id,
        role: "faculty",
        isActive: true,
      }),
      Question.countDocuments({ college: college._id }),
    ]);

    const collegeInfo = {
      ...college.toObject(),
      stats: {
        students: studentCount,
        faculty: facultyCount,
        questions: questionCount,
      },
    };

    res.status(200).json({
      success: true,
      college: collegeInfo,
    });
  } catch (error) {
    console.error("Get my college error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching college information",
      error: error.message,
    });
  }
};

module.exports = {
  getAllColleges,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  getCollegeStats,
  searchColleges,
  getMyCollege,
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const College = require("../models/College");

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// ===========================================
// REGISTER NEW USER
// ===========================================

const register = async (req, res) => {
  try {
    const { name, email, password, role, department, year } = req.body;

    // 1. Check if all required fields are provided
    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // 3. Extract college domain from email
    const emailDomain = email.split("@")[1];

    // 4. Check if college exists in our system
    const college = await College.findOne({ emailDomain });
    if (!college) {
      return res.status(400).json({
        success: false,
        message: `College with domain ${emailDomain} is not registered. Please contact admin.`,
      });
    }

    // 5. Check if college is active
    if (!college.isActive) {
      return res.status(400).json({
        success: false,
        message: "This college is currently inactive. Please contact admin.",
      });
    }

    // 6. Validate year field for students
    if (role === "student" && (!year || year < 1 || year > 6)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid year (1-6) for student registration",
      });
    }

    // 7. Create new user
    const newUser = new User({
      name,
      email,
      password, // Will be automatically hashed by the User model middleware
      college: college._id,
      role: role || "student", // Default to student
      department,
      year: role === "student" ? year : undefined,
    });

    await newUser.save();

    // 8. Update college student count
    await College.findByIdAndUpdate(college._id, {
      $inc: { totalStudents: 1 },
    });

    // 9. Generate JWT token
    const token = generateToken(newUser._id);

    // 10. Send response (don't include password)
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        year: newUser.year,
        college: {
          id: college._id,
          name: college.name,
          location: college.location,
        },
        stats: newUser.stats,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// ===========================================
// LOGIN USER
// ===========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // 2. Find user and include password field (normally excluded)
    const user = await User.findOne({ email })
      .select("+password")
      .populate("college");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // 4. Check if user's college is active
    if (!user.college.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your college is currently inactive. Please contact admin.",
      });
    }

    // 5. Compare provided password with hashed password in database
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 6. Generate JWT token
    const token = generateToken(user._id);

    // 7. Send response (don't include password)
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        college: {
          id: user.college._id,
          name: user.college.name,
          location: user.college.location,
        },
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// ===========================================
// GET CURRENT USER INFO
// ===========================================

const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.userId).populate("college");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        avatar: user.avatar,
        bio: user.bio,
        college: {
          id: user.college._id,
          name: user.college.name,
          location: user.college.location,
        },
        stats: user.stats,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user info",
      error: error.message,
    });
  }
};

// ===========================================
// UPDATE USER PROFILE
// ===========================================

const updateProfile = async (req, res) => {
  try {
    const { name, bio, department, year } = req.body;
    const userId = req.user.userId;

    // Fields that can be updated
    const updateFields = {};
    if (name) updateFields.name = name;
    if (bio) updateFields.bio = bio;
    if (department) updateFields.department = department;
    if (year && req.user.role === "student") updateFields.year = year;

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    }).populate("college");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        year: updatedUser.year,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        college: {
          id: updatedUser.college._id,
          name: updatedUser.college.name,
          location: updatedUser.college.location,
        },
        stats: updatedUser.stats,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
      error: error.message,
    });
  }
};

// ===========================================
// LOGOUT USER
// ===========================================

const logout = async (req, res) => {
  try {
    // With JWT, logout is handled on the client side by removing the token
    // But we can add server-side logic here if needed (like blacklisting tokens)

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// Export all functions
module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
};

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ===========================================
// PROTECT ROUTES - Verify JWT Token
// ===========================================

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check if token exists in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1]; // Extract token from "Bearer TOKEN"
    }

    // 2. If no token provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    try {
      // 3. Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user and attach to request
      const user = await User.findById(decoded.userId).populate("college");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Token is valid but user not found",
        });
      }

      // 5. Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "User account is deactivated",
        });
      }

      // 6. Check if user's college is active
      if (!user.college.isActive) {
        return res.status(401).json({
          success: false,
          message: "Your college is currently inactive",
        });
      }

      // 7. Add user info to request object
      req.user = {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        department: user.department,
        year: user.year,
      };

      next(); // Continue to the protected route
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in authentication",
      error: error.message,
    });
  }
};

// ===========================================
// AUTHORIZE SPECIFIC ROLES
// ===========================================

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Please login first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires ${roles.join(
          " or "
        )} role.`,
      });
    }

    next();
  };
};

// ===========================================
// CHECK SAME COLLEGE (Users can only see their college's content)
// ===========================================

const sameCollege = (req, res, next) => {
  // This middleware ensures users can only access content from their own college
  // We'll use this for questions, answers, etc.

  if (!req.user || !req.user.college) {
    return res.status(401).json({
      success: false,
      message: "Access denied. College information not found.",
    });
  }

  // Add college filter to request
  req.collegeFilter = { college: req.user.college._id };
  next();
};

// ===========================================
// OPTIONAL AUTH (For routes that work with or without login)
// ===========================================

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check if token exists
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      try {
        // If token exists, verify it and add user to request
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).populate("college");

        if (user && user.isActive && user.college.isActive) {
          req.user = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            college: user.college,
            department: user.department,
            year: user.year,
          };
        }
      } catch (jwtError) {
        // If token is invalid, just continue without user (don't throw error)
        console.log("Optional auth: Invalid token, continuing without user");
      }
    }

    next(); // Continue regardless of token validity
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue even if there's an error
  }
};

module.exports = {
  protect,
  authorize,
  sameCollege,
  optionalAuth,
};

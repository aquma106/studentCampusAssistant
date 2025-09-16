const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// This model defines what information we store about each user
const userSchema = new mongoose.Schema(
  {
    // Basic user information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // Email - must be college email
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // No two users can have same email
      lowercase: true, // Convert to lowercase
      match: [
        // Check if email format is valid
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email",
      ],
    },

    // Password - will be encrypted before storing
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't send password in API responses
    },

    // Which college does this user belong to?
    college: {
      type: mongoose.Schema.Types.ObjectId, // This links to College model
      ref: "College", // Tell MongoDB which collection to connect to
      required: [true, "College is required"],
    },

    // What type of user is this?
    role: {
      type: String,
      enum: ["student", "faculty", "admin"], // Only these 3 values allowed
      default: "student", // Most users will be students
    },

    // What subject/field are they in?
    department: {
      type: String,
      required: true,
      trim: true,
      // Example: "Computer Science", "Biology", "Mathematics"
    },

    // What year are they in? (only for students)
    year: {
      type: Number,
      required: function () {
        return this.role === "student"; // Only required if user is a student
      },
      min: [1, "Year must be at least 1"],
      max: [6, "Year cannot exceed 6"], // Covers undergrad + postgrad
    },

    // Profile picture URL
    avatar: {
      type: String,
      default: "default-avatar.png", // Default image if none provided
    },

    // Short description about the user
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },

    // Simple stats to show user activity (optional)
    stats: {
      questionsAsked: {
        type: Number,
        default: 0,
      },
      answersGiven: {
        type: Number,
        default: 0,
      },
      bestAnswersCount: {
        type: Number,
        default: 0, // How many of their answers were marked as "best"
      },
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Create database indexes for faster searches
userSchema.index({ email: 1, college: 1 });
userSchema.index({ college: 1, role: 1 });

// MIDDLEWARE: This runs BEFORE saving a user to database
// It encrypts the password so we never store plain text passwords
userSchema.pre("save", async function (next) {
  // Only hash password if it's new or being changed
  if (!this.isModified("password")) return next();

  // Encrypt the password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// METHOD: Compare provided password with encrypted password in database
// We'll use this during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// METHOD: Get college domain from email
// Example: "john@harvard.edu" returns "harvard.edu"
userSchema.methods.getCollegeDomain = function () {
  return this.email.split("@")[1];
};

// Export the model so other files can use it
module.exports = mongoose.model("User", userSchema);

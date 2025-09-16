const mongoose = require("mongoose");

// This is like creating a template/form for college information
const collegeSchema = new mongoose.Schema(
  {
    // College name - required field
    name: {
      type: String, // Data type: text
      required: [true, "College name is required"], // Must be provided
      trim: true, // Removes extra spaces
      unique: true, // No two colleges can have same name
    },

    // Email domain for verification (like "harvard.edu", "mit.edu")
    emailDomain: {
      type: String,
      required: [true, "Email domain is required"],
      unique: true, // Each college has unique domain
      lowercase: true, // Convert to lowercase automatically
      // Example: if student email is "john@harvard.edu", domain is "harvard.edu"
    },

    // College location information
    location: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      state: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Is this college active in our system?
    isActive: {
      type: Boolean,
      default: true, // New colleges are active by default
    },

    // Statistics - these will be updated as users join and ask questions
    totalStudents: {
      type: Number,
      default: 0, // Starts at 0, increases as students register
    },

    totalQuestions: {
      type: Number,
      default: 0, // Starts at 0, increases as questions are asked
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create indexes for faster database searches
// When someone searches for colleges, this makes it faster
collegeSchema.index({ name: 1, emailDomain: 1 });

// Export the model so other files can use it
module.exports = mongoose.model("College", collegeSchema);

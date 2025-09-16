const mongoose = require("mongoose");

// This model defines the questions students ask
const questionSchema = new mongoose.Schema(
  {
    // Question title - what the student is asking
    title: {
      type: String,
      required: [true, "Question title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // Detailed description of the problem
    content: {
      type: String,
      required: [true, "Question content is required"],
      maxlength: [2000, "Content cannot exceed 2000 characters"],
    },

    // What type of problem is this?
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "lost-and-found", // Lost my ID card, found someone's books
        "roommate", // Looking for roommate
        "academic-help", // Help with subjects, assignments
        "campus-info", // Where is the library? When is the exam?
        "general", // General college life questions
        "events", // College events, fests
        "career", // Internships, placements, career advice
        "hostel", // Hostel-related issues
        "transport", // College bus, local transport
      ],
    },

    // Tags to help categorize and search
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Who asked this question?
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which college is this question for?
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

    // Images (useful for lost-and-found, showing assignments, etc.)
    images: [
      {
        url: String,
        description: String, // What does this image show?
      },
    ],

    // All answers to this question
    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer",
      },
    ],

    // Which answer did the question author find most helpful?
    bestAnswer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Answer",
    },

    // How many people viewed this question?
    views: {
      type: Number,
      default: 0,
    },

    // Is this problem solved?
    isResolved: {
      type: Boolean,
      default: false,
    },

    // Should this question appear at the top? (for important announcements)
    isPinned: {
      type: Boolean,
      default: false,
    },

    // If someone reports inappropriate content
    isReported: {
      type: Boolean,
      default: false,
    },

    // For lost and found questions - special fields
    lostFoundDetails: {
      itemType: String, // "Phone", "Books", "ID Card", etc.
      location: String, // "Near Library", "Hostel Block A"
      dateTime: Date, // When was it lost/found?
      contactInfo: String, // Phone number or email to contact
      isFound: {
        // Has the item been returned to owner?
        type: Boolean,
        default: false,
      },
    },

    // For roommate questions - special fields
    roommateDetails: {
      roomType: String, // "Single", "Double", "Triple"
      preferences: String, // "Non-smoker", "Quiet", "Early riser"
      budget: String, // "5000-8000 per month"
      location: String, // "Near college", "Specific area"
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Database indexes for faster searches
questionSchema.index({ college: 1, category: 1, createdAt: -1 });
questionSchema.index({ author: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ title: "text", content: "text" }); // For text search

// Virtual field - count how many answers this question has
questionSchema.virtual("answerCount").get(function () {
  return this.answers.length;
});

// Make sure virtual fields appear in JSON responses
questionSchema.set("toJSON", { virtuals: true });

// MIDDLEWARE: Update view count when question is accessed
questionSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

// METHOD: Mark question as resolved
questionSchema.methods.markAsResolved = async function (bestAnswerId = null) {
  this.isResolved = true;
  if (bestAnswerId) {
    this.bestAnswer = bestAnswerId;
  }
  await this.save();
};

// Export the model
module.exports = mongoose.model("Question", questionSchema);

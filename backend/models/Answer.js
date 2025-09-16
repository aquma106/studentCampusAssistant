const mongoose = require("mongoose");

// This model defines the answers/replies to questions
const answerSchema = new mongoose.Schema(
  {
    // The actual answer content
    content: {
      type: String,
      required: [true, "Answer content is required"],
      maxlength: [2000, "Answer cannot exceed 2000 characters"],
    },

    // Who wrote this answer?
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Which question is this answering?
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    // Images to support the answer (screenshots, photos, etc.)
    images: [
      {
        url: String,
        description: String,
      },
    ],

    // Instead of upvotes/downvotes, simple "helpful" count
    helpfulCount: {
      type: Number,
      default: 0,
    },

    // Who marked this as helpful?
    markedHelpfulBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        markedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Is this the best answer according to question author?
    isBestAnswer: {
      type: Boolean,
      default: false,
    },

    // If someone reports inappropriate content
    isReported: {
      type: Boolean,
      default: false,
    },

    // Answer status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Database indexes
answerSchema.index({ question: 1, createdAt: -1 });
answerSchema.index({ author: 1 });

// METHOD: Mark this answer as helpful by a user
answerSchema.methods.markAsHelpful = async function (userId) {
  // Check if user already marked it helpful
  const alreadyMarked = this.markedHelpfulBy.find(
    (mark) => mark.user.toString() === userId.toString()
  );

  if (alreadyMarked) {
    return { success: false, message: "Already marked as helpful" };
  }

  // Add to helpful list
  this.markedHelpfulBy.push({ user: userId });
  this.helpfulCount += 1;
  await this.save();

  return { success: true, message: "Marked as helpful" };
};

// METHOD: Remove helpful mark
answerSchema.methods.removeHelpfulMark = async function (userId) {
  const markIndex = this.markedHelpfulBy.findIndex(
    (mark) => mark.user.toString() === userId.toString()
  );

  if (markIndex === -1) {
    return { success: false, message: "Not marked as helpful yet" };
  }

  // Remove from helpful list
  this.markedHelpfulBy.splice(markIndex, 1);
  this.helpfulCount -= 1;
  await this.save();

  return { success: true, message: "Helpful mark removed" };
};

// METHOD: Set as best answer
answerSchema.methods.setAsBestAnswer = async function () {
  // First, remove best answer status from other answers to same question
  await Answer.updateMany(
    { question: this.question, _id: { $ne: this._id } },
    { isBestAnswer: false }
  );

  // Set this as best answer
  this.isBestAnswer = true;
  await this.save();

  // Update the question to mark it as resolved
  const Question = require("./Question");
  await Question.findByIdAndUpdate(this.question, {
    bestAnswer: this._id,
    isResolved: true,
  });
};

// Export the model
module.exports = mongoose.model("Answer", answerSchema);

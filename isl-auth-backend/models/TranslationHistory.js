const mongoose = require("mongoose");

/**
 * TranslationHistory Schema
 * Stores historical sign language translations produced by users.
 * - userId: Reference to the User who performed the translation
 * - translatedText: The predicted/translated text result
 * - timestamp: When the translation was captured (defaults to current date/time)
 */
const TranslationHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "userId is required to associate translation history"],
    index: true, // Index for faster lookups by user
  },
  translatedText: {
    type: String,
    required: [true, "translatedText is required"],
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting by newest first
  },
});

module.exports = mongoose.model("TranslationHistory", TranslationHistorySchema);

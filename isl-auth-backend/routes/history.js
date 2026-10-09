const express = require("express");
const router = express.Router();
const TranslationHistory = require("../models/TranslationHistory");
const authenticate = require("../middleware/authenticate");

/**
 * @route   POST /api/history
 * @desc    Save a new sign language translation for the authenticated user
 * @access  Protected (Requires JWT)
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const { translatedText } = req.body;

    // 1. Validation: Ensure translated text is provided
    if (!translatedText || typeof translatedText !== "string" || !translatedText.trim()) {
      return res.status(400).json({
        success: false,
        message: "translatedText is required and must not be empty.",
      });
    }

    // 2. Create history record linked to authenticated user's ID
    const historyItem = new TranslationHistory({
      userId: req.user.id,
      translatedText: translatedText.trim(),
      timestamp: new Date(),
    });

    await historyItem.save();

    return res.status(201).json({
      success: true,
      message: "Translation saved to history successfully.",
      data: historyItem,
    });
  } catch (error) {
    console.error("Save History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save translation history.",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/history
 * @desc    Retrieve all translation history records for the authenticated user (newest first)
 * @access  Protected (Requires JWT)
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // Query records belonging exclusively to this authenticated user, sorted descending by timestamp
    const history = await TranslationHistory.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100); // Sensible limit to prevent overwhelming payloads

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Get History Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch translation history.",
      error: error.message,
    });
  }
});

module.exports = router;

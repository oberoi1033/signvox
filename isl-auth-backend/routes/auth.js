const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Helper function to generate 1-day JWT
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "signvox_super_secret_jwt_key_2026";
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn: "1d" } // 1 day expiry as per requirements
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user, hash password, and issue JWT token
 * @access  Public
 */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: Ensure all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // 3. Hash the password with bcrypt (10 salt rounds)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save new user to MongoDB
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });
    await newUser.save();

    // 5. Generate JWT token
    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and issue JWT token
 * @access  Public
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    // 2. Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 3. Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 4. Generate JWT token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
});

module.exports = router;

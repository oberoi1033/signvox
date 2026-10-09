const mongoose = require("mongoose");

/**
 * User Schema
 * Represents registered users in the SignVox application.
 * - name: Display name of the user
 * - email: Unique login identifier (lowercase & trimmed)
 * - password: Hashed password string (via bcrypt)
 * - createdAt: Timestamp of account creation
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

module.exports = mongoose.model("User", UserSchema);

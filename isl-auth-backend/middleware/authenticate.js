const jwt = require("jsonwebtoken");

/**
 * Authentication Middleware
 * Validates JWT bearer tokens passed in the `Authorization` header.
 * Attaches the decoded user payload ({ id, email, name }) to `req.user`.
 * Returns 401 Unauthorized if missing, expired, or invalid.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];

    // Check if the Authorization header exists and follows "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    // Extract the token part after "Bearer "
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token missing.",
      });
    }

    // Verify token using the secret key
    const secret = process.env.JWT_SECRET || "signvox_super_secret_jwt_key_2026";
    const decoded = jwt.verify(token, secret);

    // Attach decoded user payload (id, email, name) to request object
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please log in again.",
    });
  }
}

module.exports = authenticate;

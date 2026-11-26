
const jwt = require("jsonwebtoken");

module.exports= (req, res, next) => {
  try {
    // Step 1: Get authorization header
    const authHeader = req.headers.authorization;

    // Step 2: Check whether token exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required"
      });
    }

    // Step 3: Extract token from Bearer token
    const token = authHeader.split(" ")[1];

    if (!authHeader.startsWith("Bearer ") || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });
    }

    // Step 4: Verify JWT token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Step 5: Store decoded information
    req.user = decoded;

    // Step 6: Continue to next middleware/controller
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};


// Login generates token with UserID.
// Middleware verifies token.
// Middleware stores decoded data in req.user.
// GetProfile reads req.user.UserID.



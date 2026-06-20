const jwt = require("jsonwebtoken");
const User = require("../model/User");

exports.protect = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    const parts = req.headers.authorization.split(" ");
    // Support both: "Bearer <token>" and legacy "Bearer <token> <refreshToken> <userId>"
    const token = parts[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).lean();
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req?.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user?.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

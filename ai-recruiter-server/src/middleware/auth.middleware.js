const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const User = require("../models/User");
const { normalizeRole } = require("../utils/roles");

async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: "Authentication token is required" }
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: "User not found or session invalid" }
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: normalizeRole(user.role),
      name: user.name
    };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid or expired authentication token" }
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: "Authentication required" } });
    }
    if (req.user.role !== role && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: { message: `Forbidden: requires ${role} role` } });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };

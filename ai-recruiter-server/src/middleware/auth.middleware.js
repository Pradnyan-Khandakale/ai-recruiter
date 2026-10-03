const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const User = require("../models/User");
const { normalizeRole } = require("../utils/roles");

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: { message: "Authentication token is required" }
    });
  }

  const token = authHeader.split(" ")[1];
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
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: "Invalid or expired authentication token" }
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: "Authentication required" }
      });
    }
    const userRole = normalizeRole(req.user.role);
    const targetRole = normalizeRole(role);
    if (userRole !== targetRole && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: { message: `Forbidden: requires ${targetRole} role` }
      });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };

const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const User = require("../models/User");
const { normalizeRole } = require("../utils/roles");

async function requireAuth(req, res, next) {
  // TODO: Read the Bearer token, reject with 401 when it is missing or invalid.
  // TODO: Verify the token, load the user, normalize the stored role, and set req.user
  // TODO: to { id, email, role }.
  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    // TODO: Reject with 403 unless req.user.role matches the required role or is "admin".
    return next();
  };
}

module.exports = { requireAuth, requireRole };

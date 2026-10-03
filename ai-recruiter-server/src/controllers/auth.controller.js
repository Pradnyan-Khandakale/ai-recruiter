const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response");

async function signup(req, res) {
  // TODO: Register the recruiter through authService and respond with 201 { user, token }.
  return res.status(501).json({ success: false, error: { message: "Signup is not implemented yet" } });
}

async function login(req, res) {
  // TODO: Authenticate through authService and respond with { user, token }.
  return res.status(501).json({ success: false, error: { message: "Login is not implemented yet" } });
}

async function me(req, res) {
  // TODO: Respond with the profile of the authenticated user.
  return res.status(501).json({ success: false, error: { message: "Current user lookup is not implemented yet" } });
}

module.exports = { signup, login, me };

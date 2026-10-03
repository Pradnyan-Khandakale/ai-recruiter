const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response");

async function signup(req, res) {
  const result = await authService.signup(req.body);
  return sendSuccess(res, result, 201);
}

async function login(req, res) {
  const result = await authService.login(req.body);
  return sendSuccess(res, result, 200);
}

async function me(req, res) {
  const user = await authService.me(req.user.id);
  return sendSuccess(res, { user }, 200);
}

module.exports = { signup, login, me };

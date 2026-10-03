const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");
const { normalizeRole } = require("../utils/roles");

function signToken(user) {
  const userId = user._id ? user._id.toString() : user.id;
  return jwt.sign(
    {
      id: userId,
      email: user.email,
      role: normalizeRole(user.role)
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
}

function serializeUser(user) {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role || "recruiter",
    created_at: user.created_at
  };
}

async function signup(payload) {
  const { name, email, password, role } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email already registered");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: normalizeRole(role)
  });

  return { user: serializeUser(user), token: signToken(user) };
}

async function login(payload) {
  const { email, password } = payload;
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return { user: serializeUser(user), token: signToken(user) };
}

async function me(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return serializeUser(user);
}

module.exports = { signup, login, me, signToken, serializeUser };

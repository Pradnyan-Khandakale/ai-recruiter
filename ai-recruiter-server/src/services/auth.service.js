const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");
const { normalizeRole } = require("../utils/roles");

function signToken(user) {
  // TODO: Sign a 7 day JWT carrying the user id, email, and normalized role.
  return "";
}

function serializeUser(user) {
  // TODO: Return only the safe fields (id, name, email, role, created_at).
  return null;
}

async function normalizeUserRole(user) {
  // TODO: Persist the normalized role when the stored value is out of date.
  return user;
}

async function signup(payload) {
  // TODO: Reject duplicate emails with 409, hash the password with bcrypt,
  // TODO: create the user, and return { user, token }.
  throw Object.assign(new Error("Signup service is not implemented yet"), { statusCode: 501 });
}

async function login(payload) {
  // TODO: Look up the user, compare the password, and return { user, token } or throw 401.
  throw Object.assign(new Error("Login service is not implemented yet"), { statusCode: 501 });
}

async function me(userId) {
  // TODO: Load the user by id and return the serialized profile, or throw 404.
  throw Object.assign(new Error("Current user service is not implemented yet"), { statusCode: 501 });
}

module.exports = { signup, login, me };

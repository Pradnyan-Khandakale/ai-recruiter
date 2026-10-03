const { z } = require("zod");

// TODO: Require name (min 2), a valid email, a password of at least 8 characters,
// TODO: and a role enum of "recruiter" | "admin" defaulting to "recruiter".
const signupSchema = z.object({}).passthrough();

// TODO: Require a valid email and a non-empty password.
const loginSchema = z.object({}).passthrough();

module.exports = { signupSchema, loginSchema };

const { z } = require("zod");

// Require name (min 2), a valid email, a password of at least 8 characters,
// and a role enum of "recruiter" | "admin" defaulting to "recruiter".
const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["recruiter", "admin"]).default("recruiter").optional()
});

// Require a valid email and a non-empty password.
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

module.exports = { signupSchema, loginSchema };

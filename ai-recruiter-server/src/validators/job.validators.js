const { z } = require("zod");

function parseSkills(val) {
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

const jobSchema = z.object({
  title: z
    .string({ required_error: "Job title is required" })
    .trim()
    .min(2, "Title must be at least 2 characters"),
  description: z
    .string({ required_error: "Job description is required" })
    .trim()
    .min(10, "Description must be at least 10 characters"),
  required_skills: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([])
    .transform(parseSkills),
  preferred_skills: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .default([])
    .transform(parseSkills),
  min_experience: z.coerce
    .number({ invalid_type_error: "Minimum experience must be a number" })
    .min(0, "Minimum experience must be 0 or greater")
    .default(0),
  workflow_spec_id: z.string().optional().default("default-hiring-workflow"),
  hiring_spec_id: z.string().optional().default("frontend-developer"),
  company: z.string().optional().default("Acme Corp"),
  location: z.string().optional().default("Remote"),
  employment_type: z
    .enum(["full-time", "part-time", "contract", "internship"])
    .optional()
    .default("full-time"),
  salary_range: z.string().optional(),
  status: z.enum(["draft", "published", "closed"]).optional().default("published"),
  is_published: z.boolean().optional()
}).passthrough();

const jobUpdateSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").optional(),
  description: z.string().trim().min(10, "Description must be at least 10 characters").optional(),
  required_skills: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? parseSkills(val) : undefined)),
  preferred_skills: z
    .union([z.array(z.string()), z.string()])
    .optional()
    .transform((val) => (val !== undefined ? parseSkills(val) : undefined)),
  min_experience: z.coerce
    .number()
    .min(0, "Minimum experience must be 0 or greater")
    .optional(),
  workflow_spec_id: z.string().optional(),
  hiring_spec_id: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  employment_type: z.enum(["full-time", "part-time", "contract", "internship"]).optional(),
  salary_range: z.string().optional(),
  status: z.enum(["draft", "published", "closed"]).optional(),
  is_published: z.boolean().optional()
}).passthrough();

module.exports = { jobSchema, jobUpdateSchema };

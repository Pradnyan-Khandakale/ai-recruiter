const { z } = require("zod");

const candidateUploadSchema = z.object({
  job_id: z.string({ required_error: "Job ID is required" }).min(1, "Job ID is required"),
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email address")
    .toLowerCase(),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number must be at least 7 characters")
}).passthrough();

module.exports = { candidateUploadSchema };

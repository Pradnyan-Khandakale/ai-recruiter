const { z } = require("zod");

const analyticsQuerySchema = z.object({
  job_id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid job ID format").optional(),
  from: z.string().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid 'from' date format").optional(),
  to: z.string().refine((val) => !val || !isNaN(Date.parse(val)), "Invalid 'to' date format").optional(),
  include_archived: z.enum(["true", "false"]).optional()
});

module.exports = { analyticsQuerySchema };

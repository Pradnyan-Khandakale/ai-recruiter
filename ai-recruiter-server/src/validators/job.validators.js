const { z } = require("zod");

// TODO: Require title (min 2), description (min 10), the required and preferred skill
// TODO: arrays, min_experience (coerced number), workflow_spec_id, and hiring_spec_id.
const jobSchema = z.object({}).passthrough();

module.exports = { jobSchema };

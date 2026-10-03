const { z } = require("zod");

// TODO: Require job_id, name (min 2), a valid email, and a phone of at least 7 characters.
const candidateUploadSchema = z.object({}).passthrough();

module.exports = { candidateUploadSchema };

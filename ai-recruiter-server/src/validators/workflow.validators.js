const { z } = require("zod");

// TODO: Require candidate_id and job_id.
const startWorkflowSchema = z.object({}).passthrough();

// TODO: Require workflow_id.
const retryWorkflowSchema = z.object({}).passthrough();

// TODO: Require workflow_id and an approved boolean defaulting to true.
const approveWorkflowSchema = z.object({}).passthrough();

module.exports = { startWorkflowSchema, retryWorkflowSchema, approveWorkflowSchema };

const { z } = require("zod");

const startWorkflowSchema = z.object({
  candidate_id: z.string().min(1, "Candidate ID is required"),
  job_id: z.string().min(1, "Job ID is required")
});

const retryWorkflowSchema = z.object({
  workflow_id: z.string().min(1, "Workflow ID is required")
});

const approveWorkflowSchema = z.object({
  workflow_id: z.string().min(1, "Workflow ID is required"),
  approved: z.boolean().default(true)
});

module.exports = { startWorkflowSchema, retryWorkflowSchema, approveWorkflowSchema };

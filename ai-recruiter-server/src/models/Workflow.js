const mongoose = require("mongoose");

// TODO: Define the fields: candidate_id, job_id, current_state, status ("pending" |
// TODO: "running" | "waiting_approval" | "completed" | "failed"), state, retries
// TODO: (Map of Number), created_at, updated_at.
const workflowSchema = new mongoose.Schema({});

workflowSchema.pre("save", function setUpdatedAt(next) {
  // TODO: Refresh updated_at before every save.
  next();
});

module.exports = mongoose.model("Workflow", workflowSchema);

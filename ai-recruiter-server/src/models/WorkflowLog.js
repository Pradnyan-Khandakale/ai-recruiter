const mongoose = require("mongoose");

// TODO: Define the fields: workflow_id, agent_name, input, output,
// TODO: status ("running" | "success" | "failed" | "waiting_approval"), error,
// TODO: retry_count, created_at.
const workflowLogSchema = new mongoose.Schema({});

module.exports = mongoose.model("WorkflowLog", workflowLogSchema);

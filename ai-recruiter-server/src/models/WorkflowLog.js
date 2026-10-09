const mongoose = require("mongoose");

const workflowLogSchema = new mongoose.Schema({
  workflow_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workflow",
    required: true,
    index: true
  },
  agent_name: {
    type: String,
    required: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ["running", "success", "failed", "waiting_approval"],
    required: true
  },
  error: {
    type: String,
    default: null
  },
  retry_count: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model("WorkflowLog", workflowLogSchema);

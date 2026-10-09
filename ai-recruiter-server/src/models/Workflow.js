const mongoose = require("mongoose");

const workflowSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  },
  current_state: {
    type: String,
    default: "resume_parser"
  },
  status: {
    type: String,
    enum: ["pending", "running", "waiting_approval", "completed", "failed"],
    default: "pending"
  },
  state: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({})
  },
  retries: {
    type: Map,
    of: Number,
    default: () => new Map()
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

workflowSchema.index({ candidate_id: 1, job_id: 1 });
workflowSchema.index({ job_id: 1, status: 1 });

workflowSchema.pre("save", function setUpdatedAt(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model("Workflow", workflowSchema);

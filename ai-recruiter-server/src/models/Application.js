const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: [true, "Candidate reference is required"],
    index: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: [true, "Job reference is required"],
    index: true
  },
  recruiter_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  status: {
    type: String,
    enum: ["applied", "pending", "reviewed", "shortlisted", "rejected"],
    default: "applied",
    index: true
  },
  resume_url: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    default: "public_portal"
  },
  submitted_information: {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true }
  },
  notes: {
    type: String,
    default: ""
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

applicationSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

// Enforce unique application per candidate per job
applicationSchema.index({ job_id: 1, candidate_id: 1 }, { unique: true });
applicationSchema.index({ recruiter_id: 1, created_at: -1 });
applicationSchema.index({ job_id: 1, created_at: -1 });

module.exports = mongoose.model("Application", applicationSchema);

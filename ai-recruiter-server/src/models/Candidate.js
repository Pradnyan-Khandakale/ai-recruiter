const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Candidate name is required"],
    trim: true,
    minlength: [2, "Candidate name must be at least 2 characters"]
  },
  email: {
    type: String,
    required: [true, "Candidate email is required"],
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: [true, "Candidate phone number is required"],
    trim: true,
    minlength: [7, "Phone number must be at least 7 characters"]
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    index: true
  },
  resume_url: {
    type: String,
    trim: true
  },
  parsed_resume_json: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  match_score: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["applied", "pending", "reviewed", "shortlisted", "rejected"],
    default: "applied",
    index: true
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

candidateSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

candidateSchema.index({ email: 1, created_at: -1 });
candidateSchema.index({ job_id: 1, created_at: -1 });

module.exports = mongoose.model("Candidate", candidateSchema);

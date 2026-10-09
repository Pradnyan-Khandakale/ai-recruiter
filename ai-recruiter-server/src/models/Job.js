const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Job title is required"],
    trim: true,
    minlength: [2, "Job title must be at least 2 characters"]
  },
  description: {
    type: String,
    required: [true, "Job description is required"],
    trim: true,
    minlength: [10, "Job description must be at least 10 characters"]
  },
  company: {
    type: String,
    trim: true,
    default: "Acme Corp"
  },
  location: {
    type: String,
    trim: true,
    default: "Remote"
  },
  employment_type: {
    type: String,
    enum: ["full-time", "part-time", "contract", "internship"],
    default: "full-time"
  },
  salary_range: {
    type: String,
    trim: true
  },
  required_skills: {
    type: [String],
    default: []
  },
  preferred_skills: {
    type: [String],
    default: []
  },
  min_experience: {
    type: Number,
    default: 0,
    min: [0, "Minimum experience must be 0 or greater"]
  },
  workflow_spec_id: {
    type: String,
    default: "default-hiring-workflow"
  },
  hiring_spec_id: {
    type: String,
    default: "frontend-developer"
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator (recruiter) ID is required"],
    index: true
  },
  status: {
    type: String,
    enum: ["draft", "published", "closed"],
    default: "published",
    index: true
  },
  is_published: {
    type: Boolean,
    default: true
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

jobSchema.pre("save", function (next) {
  this.updated_at = new Date();
  if (this.status === "draft") {
    this.is_published = false;
  } else if (this.status === "published") {
    this.is_published = true;
  }
  next();
});

jobSchema.index({ created_by: 1, created_at: -1 });
jobSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model("Job", jobSchema);

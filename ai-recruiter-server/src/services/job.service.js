const mongoose = require("mongoose");
const Job = require("../models/Job");
const { loadHiringSpec } = require("../utils/specLoader");

async function createJob(payload, userId) {
  const hiringSpec = loadHiringSpec(payload.hiring_spec_id || "frontend-developer");

  const requiredSkills =
    payload.required_skills && payload.required_skills.length > 0
      ? payload.required_skills
      : hiringSpec.required_skills || [];

  const preferredSkills =
    payload.preferred_skills && payload.preferred_skills.length > 0
      ? payload.preferred_skills
      : hiringSpec.preferred_skills || [];

  const status = payload.status || "published";
  const isPublished = status === "published";

  const job = new Job({
    title: payload.title,
    description: payload.description,
    company: payload.company || "Acme Corp",
    location: payload.location || "Remote",
    employment_type: payload.employment_type || "full-time",
    salary_range: payload.salary_range,
    required_skills: requiredSkills,
    preferred_skills: preferredSkills,
    min_experience: payload.min_experience ?? 0,
    workflow_spec_id: payload.workflow_spec_id || "default-hiring-workflow",
    hiring_spec_id: payload.hiring_spec_id || "frontend-developer",
    created_by: userId,
    status,
    is_published: isPublished
  });

  await job.save();
  return job;
}

async function listJobs(options = {}, user = null) {
  const filter = {};

  if (user && !options.public) {
    // Authenticated recruiter: see their own jobs by default
    filter.created_by = user.id;
  } else {
    // Public / unauthenticated: only published jobs
    filter.status = "published";
  }

  if (options.status) {
    filter.status = options.status;
  }

  return Job.find(filter).sort({ created_at: -1 });
}

async function getJob(id, user = null) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid job ID format"), { statusCode: 400 });
  }

  const job = await Job.findById(id);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  }

  // Recruiter owner or admin can see any status
  const isOwner = user && (job.created_by.toString() === user.id || user.role === "admin");

  if (!isOwner && job.status !== "published") {
    // Do not reveal private / draft jobs to unauthorized users
    throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  }

  return job;
}

async function updateJob(id, payload, user) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid job ID format"), { statusCode: 400 });
  }

  const job = await Job.findById(id);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  }

  // Enforce ownership: only the creator (or admin) can update
  if (job.created_by.toString() !== user.id && user.role !== "admin") {
    throw Object.assign(new Error("Forbidden: You do not have permission to modify this job"), {
      statusCode: 403
    });
  }

  const allowedFields = [
    "title",
    "description",
    "company",
    "location",
    "employment_type",
    "salary_range",
    "required_skills",
    "preferred_skills",
    "min_experience",
    "workflow_spec_id",
    "hiring_spec_id",
    "status",
    "is_published"
  ];

  for (const field of allowedFields) {
    if (payload[field] !== undefined) {
      job[field] = payload[field];
    }
  }

  if (payload.status === "draft") {
    job.is_published = false;
  } else if (payload.status === "published") {
    job.is_published = true;
  }

  await job.save();
  return job;
}

async function deleteJob(id, user) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid job ID format"), { statusCode: 400 });
  }

  const job = await Job.findById(id);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  }

  if (job.created_by.toString() !== user.id && user.role !== "admin") {
    throw Object.assign(new Error("Forbidden: You do not have permission to delete this job"), {
      statusCode: 403
    });
  }

  await Job.deleteOne({ _id: id });
  return { deleted: true, id };
}

module.exports = { createJob, listJobs, getJob, updateJob, deleteJob };

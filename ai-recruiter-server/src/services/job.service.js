const Job = require("../models/Job");
const { loadHiringSpec } = require("../utils/specLoader");

async function createJob(payload, userId) {
  // TODO: Load the hiring spec, fall back to its skill lists when the payload omits them,
  // TODO: and create the job for this recruiter.
  throw Object.assign(new Error("Create job service is not implemented yet"), { statusCode: 501 });
}

async function listJobs() {
  // TODO: Return every job sorted by created_at descending.
  throw Object.assign(new Error("List jobs service is not implemented yet"), { statusCode: 501 });
}

async function getJob(id) {
  // TODO: Return the job by id or throw a 404.
  throw Object.assign(new Error("Get job service is not implemented yet"), { statusCode: 501 });
}

async function updateJob(id, payload) {
  // TODO: Update the job by id or throw a 404.
  throw Object.assign(new Error("Update job service is not implemented yet"), { statusCode: 501 });
}

module.exports = { createJob, listJobs, getJob, updateJob };

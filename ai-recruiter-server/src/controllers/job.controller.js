const jobService = require("../services/job.service");
const { sendSuccess } = require("../utils/response");

async function createJob(req, res) {
  // TODO: Create the job for req.user.id and respond with 201.
  return res.status(501).json({ success: false, error: { message: "Create job is not implemented yet" } });
}

async function listJobs(req, res) {
  // TODO: Respond with every job, newest first.
  return res.status(501).json({ success: false, error: { message: "List jobs is not implemented yet" } });
}

async function getJob(req, res) {
  // TODO: Respond with the job for req.params.id.
  return res.status(501).json({ success: false, error: { message: "Get job is not implemented yet" } });
}

async function updateJob(req, res) {
  // TODO: Update the job for req.params.id and respond with the saved document.
  return res.status(501).json({ success: false, error: { message: "Update job is not implemented yet" } });
}

module.exports = { createJob, listJobs, getJob, updateJob };

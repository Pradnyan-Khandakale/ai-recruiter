const jobService = require("../services/job.service");
const candidateService = require("../services/candidate.service");
const { sendSuccess } = require("../utils/response");

async function createJob(req, res) {
  const job = await jobService.createJob(req.body, req.user.id);
  return sendSuccess(res, job, 201);
}

async function listJobs(req, res) {
  const jobs = await jobService.listJobs(req.query, req.user);
  return sendSuccess(res, jobs, 200);
}

async function getJob(req, res) {
  const job = await jobService.getJob(req.params.id, req.user);
  return sendSuccess(res, job, 200);
}

async function updateJob(req, res) {
  const job = await jobService.updateJob(req.params.id, req.body, req.user);
  return sendSuccess(res, job, 200);
}

async function deleteJob(req, res) {
  const result = await jobService.deleteJob(req.params.id, req.user);
  return sendSuccess(res, result, 200);
}

async function listJobApplications(req, res) {
  const applications = await candidateService.listApplications(req.params.id, req.user);
  return sendSuccess(res, applications, 200);
}

module.exports = {
  createJob,
  listJobs,
  getJob,
  updateJob,
  deleteJob,
  listJobApplications
};

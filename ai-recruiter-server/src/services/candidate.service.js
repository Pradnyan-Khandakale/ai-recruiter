const Candidate = require("../models/Candidate");
const { getJob } = require("./job.service");
const workflowService = require("../workflows/hiringWorkflow.service");

async function uploadCandidate(payload, file) {
  // TODO: Require the resume file, verify the job exists, create the candidate with its
  // TODO: /uploads resume_url, start the hiring workflow, and return { candidate, workflow }.
  throw Object.assign(new Error("Candidate upload service is not implemented yet"), { statusCode: 501 });
}

async function listCandidates() {
  // TODO: Return every candidate with its populated job, newest first.
  throw Object.assign(new Error("List candidates service is not implemented yet"), { statusCode: 501 });
}

async function getCandidate(id) {
  // TODO: Return the candidate with its populated job, or throw a 404.
  throw Object.assign(new Error("Get candidate service is not implemented yet"), { statusCode: 501 });
}

module.exports = { uploadCandidate, listCandidates, getCandidate };

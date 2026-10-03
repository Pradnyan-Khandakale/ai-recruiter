const candidateService = require("../services/candidate.service");
const { sendSuccess } = require("../utils/response");

async function uploadCandidate(req, res) {
  // TODO: Save the candidate with the uploaded resume, start the hiring workflow,
  // TODO: and respond with 201 { candidate, workflow }.
  return res.status(501).json({ success: false, error: { message: "Candidate upload is not implemented yet" } });
}

async function listCandidates(req, res) {
  // TODO: Respond with every candidate and its populated job.
  return res.status(501).json({ success: false, error: { message: "List candidates is not implemented yet" } });
}

async function getCandidate(req, res) {
  // TODO: Respond with the candidate for req.params.id.
  return res.status(501).json({ success: false, error: { message: "Get candidate is not implemented yet" } });
}

module.exports = { uploadCandidate, listCandidates, getCandidate };

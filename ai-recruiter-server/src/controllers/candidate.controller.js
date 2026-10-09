const candidateService = require("../services/candidate.service");
const { sendSuccess } = require("../utils/response");

async function uploadCandidate(req, res) {
  const result = await candidateService.uploadCandidate(req.body, req.file);
  return sendSuccess(res, result, 201);
}

async function listCandidates(req, res) {
  const candidates = await candidateService.listCandidates(req.user, req.query);
  return sendSuccess(res, candidates, 200);
}

async function getCandidate(req, res) {
  const candidate = await candidateService.getCandidate(req.params.id, req.user);
  return sendSuccess(res, candidate, 200);
}

module.exports = {
  uploadCandidate,
  listCandidates,
  getCandidate
};

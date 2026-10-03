const fs = require("fs");
const path = require("path");

const specsRoot = path.join(__dirname, "..", "..", "..", "specs");
const cache = new Map();

function readSpec(relativePath) {
  // TODO: Resolve the spec path inside specsRoot, reject traversal attempts, read the
  // TODO: JSON file, and cache the parsed result.
  return {};
}

function loadHiringSpec(specId = "frontend-developer") {
  // TODO: Read specs/hiring/<specId>.json.
  return {};
}

function loadWorkflowSpec(specId = "default-hiring-workflow") {
  // TODO: Read specs/workflow/<specId>.json.
  return {};
}

function loadRetryPolicy() {
  // TODO: Read specs/system/retry-policy.json.
  return {};
}

function loadShortlistingRules() {
  // TODO: Read specs/evaluation/shortlisting-rules.json.
  return {};
}

function loadRagSpec() {
  // TODO: Read specs/evaluation/rag-retrieval.json.
  return {};
}

function loadPromptSpec(name) {
  // TODO: Read specs/prompts/<name>.json.
  return {};
}

function loadEmailSpec(name) {
  // TODO: Read specs/email/<name>.json.
  return {};
}

function loadNodeStateSpec() {
  // TODO: Read specs/workflow/node-states.json.
  return {};
}

module.exports = {
  readSpec,
  loadHiringSpec,
  loadWorkflowSpec,
  loadRetryPolicy,
  loadShortlistingRules,
  loadRagSpec,
  loadPromptSpec,
  loadEmailSpec,
  loadNodeStateSpec
};

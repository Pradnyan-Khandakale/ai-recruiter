const { loadPromptSpec, loadShortlistingRules } = require("../utils/specLoader");
const { calculateMatchScore, getShortlistedMinimumScore } = require("../utils/score");

async function runMatchingAgent({ parsedResume, hiringSpec, ragContext, shortlistingRules }) {
  // TODO: Score the parsed resume against the hiring spec using the matching prompt
  // TODO: weights and the shortlist floor, then return the score, the recommendation,
  // TODO: and how many RAG context chunks were used.
  throw new Error("Matching agent is not implemented yet");
}

module.exports = { runMatchingAgent };

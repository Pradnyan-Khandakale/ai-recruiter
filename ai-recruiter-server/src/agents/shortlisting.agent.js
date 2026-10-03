const { loadShortlistingRules } = require("../utils/specLoader");
const { chooseDecision } = require("../utils/score");

async function runShortlistingAgent({ matching }) {
  // TODO: Pick the decision that matches the score thresholds in the shortlisting rules
  // TODO: and return { success, data: { status, recommendation, match_score, missing_skills } }.
  throw new Error("Shortlisting agent is not implemented yet");
}

module.exports = { runShortlistingAgent };

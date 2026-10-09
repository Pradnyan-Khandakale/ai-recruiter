const { loadShortlistingRules } = require("../utils/specLoader");
const { chooseDecision } = require("../utils/score");

async function runShortlistingAgent({ matching, candidate, job }) {
  const rules = loadShortlistingRules();
  const rawScore = matching?.data?.match_score;
  const match_score = typeof rawScore === "number" ? rawScore : Number(rawScore || 0);
  const missing_skills = Array.isArray(matching?.data?.missing_skills) ? matching.data.missing_skills : [];

  const decision = chooseDecision(match_score, rules) || {
    status: "rejected",
    minimum_score: 0,
    recommendation: "Reject candidate"
  };

  const status = decision.status || "hold";
  const recommendation = decision.recommendation || "Hold for review";

  const rationale = `Candidate achieved a match score of ${match_score}. Decision based on evaluation policy: ${recommendation}. Missing required skills: ${missing_skills.length > 0 ? missing_skills.join(", ") : "None"}.`;

  return {
    success: true,
    data: {
      status,
      recommendation,
      match_score,
      missing_skills,
      rationale,
      candidate_id: candidate?._id || candidate?.id,
      job_id: job?._id || job?.id
    }
  };
}

module.exports = { runShortlistingAgent };

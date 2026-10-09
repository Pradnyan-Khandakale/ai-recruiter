const { loadPromptSpec, loadShortlistingRules } = require("../utils/specLoader");
const { calculateMatchScore, getShortlistedMinimumScore, chooseDecision } = require("../utils/score");

async function runMatchingAgent({ parsedResume, hiringSpec, ragContext, shortlistingRules }) {
  const promptSpec = loadPromptSpec("matching-agent");
  const rules = shortlistingRules || loadShortlistingRules();
  const shortlistFloor = getShortlistedMinimumScore(rules);

  const scoring = calculateMatchScore(parsedResume, hiringSpec, promptSpec, {
    allSkillsMatchedMinimumScore: shortlistFloor
  });

  const decision = chooseDecision(scoring.match_score, rules);
  const ragCount = Array.isArray(ragContext) ? ragContext.length : 0;

  return {
    success: true,
    data: {
      match_score: scoring.match_score,
      missing_skills: scoring.missing_skills,
      matched_required_skills: scoring.matched_required_skills,
      matched_preferred_skills: scoring.matched_preferred_skills,
      all_skills_matched: scoring.all_skills_matched,
      breakdown: scoring.breakdown,
      explanation: scoring.explanation,
      recommendation: decision?.recommendation || "Pending review",
      rag_context_count: ragCount
    }
  };
}

module.exports = { runMatchingAgent };

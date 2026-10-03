function normalizeSkill(skill) {
  // TODO: Trim and lowercase the skill for comparison.
  return String(skill || "");
}

function calculateMatchScore(parsedResume, hiringSpec, matchingSpec, options = {}) {
  // TODO: Compare the resume skills against the required and preferred lists, add the
  // TODO: experience weight when the minimum is met, apply the all-skills-matched floor,
  // TODO: and return match_score, missing_skills, the matched lists, and all_skills_matched.
  return {
    match_score: 0,
    missing_skills: [],
    matched_required_skills: [],
    matched_preferred_skills: [],
    all_skills_matched: false
  };
}

function chooseDecision(score, rules) {
  // TODO: Return the first decision whose minimum / maximum score range contains the
  // TODO: score, falling back to the last rule.
  return null;
}

function getShortlistedMinimumScore(rules) {
  // TODO: Return the minimum_score of the "shortlisted" decision.
  return 0;
}

module.exports = { calculateMatchScore, chooseDecision, getShortlistedMinimumScore };

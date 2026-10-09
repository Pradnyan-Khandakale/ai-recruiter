function normalizeSkill(skill) {
  return String(skill || "").trim().toLowerCase();
}

function calculateMatchScore(parsedResume, hiringSpec, matchingSpec, options = {}) {
  const rawSkills = Array.isArray(parsedResume?.skills) ? parsedResume.skills : [];
  const rawExp = parsedResume?.experience;
  const candidateExp = typeof rawExp === "number"
    ? rawExp
    : parseFloat(String(rawExp || 0).replace(/[^0-9.]/g, "")) || 0;

  const requiredSkills = Array.isArray(hiringSpec?.required_skills) ? hiringSpec.required_skills : [];
  const preferredSkills = Array.isArray(hiringSpec?.preferred_skills) ? hiringSpec.preferred_skills : [];
  const rawMinExp = hiringSpec?.min_experience ?? hiringSpec?.experience ?? 0;
  const minExp = typeof rawMinExp === "number"
    ? rawMinExp
    : parseFloat(String(rawMinExp || 0).replace(/[^0-9.]/g, "")) || 0;

  const weights = matchingSpec?.weights || {
    required_skills: 60,
    preferred_skills: 25,
    experience: 15
  };

  const reqWeight = Number(weights.required_skills ?? 60);
  const prefWeight = Number(weights.preferred_skills ?? 25);
  const expWeight = Number(weights.experience ?? 15);

  const candidateSkillSet = new Set(
    rawSkills.map(normalizeSkill).filter(Boolean)
  );

  const matched_required_skills = [];
  const missing_skills = [];
  for (const skill of requiredSkills) {
    if (candidateSkillSet.has(normalizeSkill(skill))) {
      matched_required_skills.push(skill);
    } else {
      missing_skills.push(skill);
    }
  }

  const matched_preferred_skills = [];
  const missing_preferred = [];
  for (const skill of preferredSkills) {
    if (candidateSkillSet.has(normalizeSkill(skill))) {
      matched_preferred_skills.push(skill);
    } else {
      missing_preferred.push(skill);
    }
  }

  const allRequiredMatched = requiredSkills.length > 0 && missing_skills.length === 0;
  const allPreferredMatched = preferredSkills.length === 0 || missing_preferred.length === 0;
  const all_skills_matched = allRequiredMatched && allPreferredMatched;

  const experienceMet = candidateExp >= minExp;

  const requiredScore = requiredSkills.length > 0
    ? (matched_required_skills.length / requiredSkills.length) * reqWeight
    : reqWeight;

  const preferredScore = (experienceMet || minExp === 0) && preferredSkills.length > 0
    ? (matched_preferred_skills.length / preferredSkills.length) * prefWeight
    : 0;

  const experienceScore = experienceMet ? expWeight : 0;

  let match_score = Math.round(requiredScore + preferredScore + experienceScore);

  if (all_skills_matched && typeof options?.allSkillsMatchedMinimumScore === "number") {
    match_score = Math.max(match_score, options.allSkillsMatchedMinimumScore);
  }

  // Ensure score is strictly bounded between 0 and 100
  match_score = Math.min(100, Math.max(0, match_score));

  const breakdown = {
    required_skills_score: Math.round(requiredScore),
    required_skills_max: reqWeight,
    preferred_skills_score: Math.round(preferredScore),
    preferred_skills_max: prefWeight,
    experience_score: experienceScore,
    experience_max: expWeight,
    experience_met: experienceMet
  };

  const explanation = `Score: ${match_score}/100. Required: ${breakdown.required_skills_score}/${reqWeight} (${matched_required_skills.length}/${requiredSkills.length} matched), Preferred: ${breakdown.preferred_skills_score}/${prefWeight} (${matched_preferred_skills.length}/${preferredSkills.length} matched), Experience: ${experienceScore}/${expWeight} (${candidateExp}y vs min ${minExp}y).`;

  return {
    match_score,
    missing_skills,
    matched_required_skills,
    matched_preferred_skills,
    all_skills_matched,
    breakdown,
    explanation
  };
}

function chooseDecision(score, rules) {
  if (!rules || !Array.isArray(rules.decisions) || rules.decisions.length === 0) {
    return null;
  }
  const numericScore = typeof score === "number" ? score : Number(score || 0);
  const sorted = [...rules.decisions].sort((a, b) => (b.minimum_score ?? 0) - (a.minimum_score ?? 0));
  for (const decision of sorted) {
    if (numericScore >= (decision.minimum_score ?? 0)) {
      return decision;
    }
  }
  return sorted[sorted.length - 1];
}

function getShortlistedMinimumScore(rules) {
  const decisions = rules?.decisions || [];
  const shortlisted = decisions.find((rule) => rule.status === "shortlisted");
  return shortlisted?.minimum_score ?? 80;
}

module.exports = {
  calculateMatchScore,
  chooseDecision,
  getShortlistedMinimumScore,
  normalizeSkill
};

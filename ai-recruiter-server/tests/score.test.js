const { calculateMatchScore, chooseDecision } = require("../src/utils/score");
const { loadHiringSpec, loadPromptSpec, loadShortlistingRules } = require("../src/utils/specLoader");

test("calculates match score from spec-defined weights", () => {
  const result = calculateMatchScore(
    { skills: ["React", "JavaScript", "CSS", "Next.js"], experience: 3 },
    { ...loadHiringSpec(), min_experience: 2 },
    loadPromptSpec("matching-agent")
  );

  expect(result.match_score).toBeGreaterThanOrEqual(loadHiringSpec().minimum_score);
});

test("chooses shortlisting decision from spec thresholds", () => {
  const rules = loadShortlistingRules();
  expect(chooseDecision(85, rules).status).toBe("shortlisted");
  expect(chooseDecision(65, rules).status).toBe("hold");
  expect(chooseDecision(20, rules).status).toBe("rejected");
});

test("all matching job skills meet the spec-defined shortlist floor", () => {
  const rules = loadShortlistingRules();
  const shortlistFloor = rules.decisions.find((rule) => rule.status === "shortlisted").minimum_score;
  const result = calculateMatchScore(
    { skills: ["GraphQL", "Redux Toolkit"], experience: 0 },
    { required_skills: ["GraphQL"], preferred_skills: ["Redux Toolkit"], min_experience: 2 },
    loadPromptSpec("matching-agent"),
    { allSkillsMatchedMinimumScore: shortlistFloor }
  );

  expect(result.all_skills_matched).toBe(true);
  expect(result.match_score).toBe(shortlistFloor);
  expect(chooseDecision(result.match_score, rules).status).toBe("shortlisted");
});

test("handles empty and malformed candidate inputs safely", () => {
  const result = calculateMatchScore(null, null, null);
  expect(result.match_score).toBe(75); // 0 required skills (60) + 0 min exp met (15) = 75
  expect(result.all_skills_matched).toBe(false);
  expect(result.missing_skills).toEqual([]);
  expect(result.matched_required_skills).toEqual([]);

  const emptyResumeResult = calculateMatchScore(
    { skills: null, experience: "not-a-number" },
    { required_skills: ["Python"], preferred_skills: ["Django"], min_experience: 3 },
    loadPromptSpec("matching-agent")
  );
  expect(emptyResumeResult.match_score).toBe(0);
  expect(emptyResumeResult.missing_skills).toEqual(["Python"]);
  expect(emptyResumeResult.all_skills_matched).toBe(false);
});

test("handles boundary decision thresholds correctly", () => {
  const rules = loadShortlistingRules();
  expect(chooseDecision(80, rules).status).toBe("shortlisted");
  expect(chooseDecision(79.9, rules).status).toBe("hold");
  expect(chooseDecision(60, rules).status).toBe("hold");
  expect(chooseDecision(59.9, rules).status).toBe("rejected");
  expect(chooseDecision(0, rules).status).toBe("rejected");
  expect(chooseDecision(-10, rules).status).toBe("rejected");
  expect(chooseDecision(100, null)).toBeNull();
});

test("provides component-level score explanation and handles duplicates and bounds", () => {
  const result = calculateMatchScore(
    { skills: ["React", "react", "REACT", "JavaScript"], experience: 5 },
    { required_skills: ["React", "JavaScript"], preferred_skills: ["Next.js"], min_experience: 2 },
    loadPromptSpec("matching-agent")
  );

  // Duplicates normalized, full required skills matched (60) + experience met (15) = 75
  expect(result.match_score).toBe(75);
  expect(result.breakdown).toBeDefined();
  expect(result.breakdown.required_skills_score).toBe(60);
  expect(result.breakdown.experience_score).toBe(15);
  expect(result.breakdown.experience_met).toBe(true);
  expect(typeof result.explanation).toBe("string");
  expect(result.explanation).toContain("Required:");
  expect(result.match_score).toBeGreaterThanOrEqual(0);
  expect(result.match_score).toBeLessThanOrEqual(100);
});

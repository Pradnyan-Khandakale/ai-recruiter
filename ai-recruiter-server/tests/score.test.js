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

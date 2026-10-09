const { z } = require("zod");
const geminiService = require("../services/gemini.service");
const { loadPromptSpec, loadShortlistingRules } = require("../utils/specLoader");
const { calculateMatchScore, getShortlistedMinimumScore, chooseDecision } = require("../utils/score");

const ExplanationSchema = z.object({
  explanation: z.string().min(5),
  strengths: z.array(z.string()).optional(),
  gaps: z.array(z.string()).optional()
});

async function runMatchingAgent({ parsedResume, hiringSpec, ragContext, shortlistingRules, options = {} }) {
  const promptSpec = loadPromptSpec("matching-agent");
  const rules = shortlistingRules || loadShortlistingRules();
  const shortlistFloor = getShortlistedMinimumScore(rules);

  const scoring = calculateMatchScore(parsedResume, hiringSpec, promptSpec, {
    allSkillsMatchedMinimumScore: shortlistFloor
  });

  const decision = chooseDecision(scoring.match_score, rules);
  const ragCount = Array.isArray(ragContext) ? ragContext.length : 0;

  let explanation = scoring.explanation;
  let provider = "rules";

  const isStrict = Boolean(options.strict || process.env.REQUIRE_GEMINI === "true");
  try {
    const prompt = `Evaluate candidate match score for role: ${hiringSpec?.role || "Position"}.
Score: ${scoring.match_score}/100.
Matched required skills: ${scoring.matched_required_skills.join(", ") || "None"}.
Matched preferred skills: ${scoring.matched_preferred_skills.join(", ") || "None"}.
Missing required skills: ${scoring.missing_skills.join(", ") || "None"}.
RAG context matches count: ${ragCount}.
Provide a concise, professional scoring explanation highlighting strengths and gaps.`;

    const geminiRes = await geminiService.generateStructuredJson({
      prompt,
      systemInstruction: "You are an AI recruitment matching evaluator. Generate structured scoring explanation, strengths, and gaps adhering to schema.",
      schema: ExplanationSchema,
      strict: isStrict
    });

    if (geminiRes.success && geminiRes.data?.explanation) {
      explanation = geminiRes.data.explanation;
      provider = "gemini";
    } else if (isStrict) {
      throw new Error(geminiRes.error || "Gemini matching explanation failed");
    }
  } catch (err) {
    if (isStrict) {
      return {
        success: false,
        error: `Strict Gemini matching explanation failed: ${err.message}`
      };
    }
  }

  return {
    success: true,
    provider,
    data: {
      match_score: scoring.match_score,
      missing_skills: scoring.missing_skills,
      matched_required_skills: scoring.matched_required_skills,
      matched_preferred_skills: scoring.matched_preferred_skills,
      all_skills_matched: scoring.all_skills_matched,
      breakdown: scoring.breakdown,
      explanation,
      recommendation: decision?.recommendation || "Pending review",
      rag_context_count: ragCount
    }
  };
}

module.exports = { runMatchingAgent };

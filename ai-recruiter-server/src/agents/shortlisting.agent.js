const { z } = require("zod");
const geminiService = require("../services/gemini.service");
const { loadShortlistingRules } = require("../utils/specLoader");
const { chooseDecision } = require("../utils/score");

const RationaleSchema = z.object({
  rationale: z.string().min(10)
});

async function runShortlistingAgent({ matching, candidate, job, options = {} }) {
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

  let rationale = `Candidate achieved a match score of ${match_score}. Decision based on evaluation policy: ${recommendation}. Missing required skills: ${missing_skills.length > 0 ? missing_skills.join(", ") : "None"}.`;
  let provider = "rules";

  const isStrict = Boolean(options.strict || process.env.REQUIRE_GEMINI === "true");
  try {
    const prompt = `Candidate shortlisting decision:
Role: ${job?.title || "Role"}.
Match Score: ${match_score}/100.
Decision: ${status} (${recommendation}).
Missing Skills: ${missing_skills.join(", ") || "None"}.
Generate a clear, professional 2-3 sentence hiring rationale for this shortlisting decision.`;

    const geminiRes = await geminiService.generateStructuredJson({
      prompt,
      systemInstruction: "You are an executive hiring decision reviewer. Produce a structured JSON object with a professional rationale adhering to schema.",
      schema: RationaleSchema,
      strict: isStrict
    });

    if (geminiRes.success && geminiRes.data?.rationale) {
      rationale = geminiRes.data.rationale;
      provider = "gemini";
    } else if (isStrict) {
      throw new Error(geminiRes.error || "Gemini shortlisting rationale failed");
    }
  } catch (err) {
    if (isStrict) {
      return {
        success: false,
        error: `Strict Gemini shortlisting failed: ${err.message}`
      };
    }
  }

  return {
    success: true,
    provider,
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

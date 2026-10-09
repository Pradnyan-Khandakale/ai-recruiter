const { z } = require("zod");
const geminiService = require("../services/gemini.service");
const { loadPromptSpec } = require("../utils/specLoader");

const InterviewSpecSchema = z.object({
  questions: z.array(z.string()).min(1),
  coding_tasks: z.array(z.string()).min(1),
  evaluation_rubrics: z.array(z.object({
    level: z.string(),
    criteria: z.string()
  })).min(1)
});

async function runInterviewAgent({ candidate, job, hiringSpec, options = {} }) {
  const required = Array.isArray(hiringSpec?.required_skills)
    ? hiringSpec.required_skills
    : (Array.isArray(job?.required_skills) ? job.required_skills : ["Problem Solving"]);

  const rounds = hiringSpec?.interview_rounds || 2;

  let questions = required.map((skill) => `Explain your practical experience and best practices using ${skill}.`);
  let codingTasks = required.map((skill) => `Implement a production-grade module demonstrating mastery in ${skill}.`);
  let rubrics = [
    { level: "Junior", criteria: "Understands fundamental syntax and core concepts" },
    { level: "Mid", criteria: "Designs clean solutions, handles edge cases and errors" },
    { level: "Senior", criteria: "Demonstrates architectural depth, performance optimization, and robust scalability" }
  ];

  let provider = "template";

  const isStrict = Boolean(options.strict || process.env.REQUIRE_GEMINI === "true");
  try {
    const prompt = `Generate technical interview questions, coding tasks, and grading rubrics for role: ${job?.title || "Software Engineer"}.
Candidate: ${candidate?.name || "Candidate"}.
Required Skills: ${required.join(", ")}.
Rounds: ${rounds}.
Generate strictly structured JSON adhering to the schema. Ensure question count and coding task count matches skills.`;

    const geminiRes = await geminiService.generateStructuredJson({
      prompt,
      systemInstruction: "You are a technical interview designer. Create precise, insightful interview questions, realistic coding tasks, and rigorous evaluation rubrics adhering to schema.",
      schema: InterviewSpecSchema,
      strict: isStrict
    });

    if (geminiRes.success && geminiRes.data) {
      if (Array.isArray(geminiRes.data.questions) && geminiRes.data.questions.length > 0) {
        questions = geminiRes.data.questions;
      }
      if (Array.isArray(geminiRes.data.coding_tasks) && geminiRes.data.coding_tasks.length > 0) {
        codingTasks = geminiRes.data.coding_tasks;
      }
      if (Array.isArray(geminiRes.data.evaluation_rubrics) && geminiRes.data.evaluation_rubrics.length > 0) {
        rubrics = geminiRes.data.evaluation_rubrics;
      }
      provider = "gemini";
    } else if (isStrict) {
      throw new Error(geminiRes.error || "Gemini interview generation failed");
    }
  } catch (err) {
    if (isStrict) {
      return {
        success: false,
        error: `Strict Gemini interview generation failed: ${err.message}`
      };
    }
  }

  return {
    success: true,
    provider,
    data: {
      candidate_id: candidate?._id || candidate?.id,
      interview_rounds: rounds,
      questions,
      coding_tasks: codingTasks,
      evaluation_rubrics: rubrics
    }
  };
}

module.exports = { runInterviewAgent };

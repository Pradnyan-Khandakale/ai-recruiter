const { loadPromptSpec } = require("../utils/specLoader");

async function runInterviewAgent({ candidate, job, hiringSpec }) {
  const required = Array.isArray(hiringSpec?.required_skills)
    ? hiringSpec.required_skills
    : (Array.isArray(job?.required_skills) ? job.required_skills : ["Problem Solving"]);

  const rounds = hiringSpec?.interview_rounds || 2;

  const questions = required.map((skill) => `Explain your practical experience and best practices using ${skill}.`);
  const codingTasks = required.map((skill) => `Implement a production-grade module demonstrating mastery in ${skill}.`);
  const rubrics = [
    { level: "Junior", criteria: "Understands fundamental syntax and core concepts" },
    { level: "Mid", criteria: "Designs clean solutions, handles edge cases and errors" },
    { level: "Senior", criteria: "Demonstrates architectural depth, performance optimization, and robust scalability" }
  ];

  return {
    success: true,
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

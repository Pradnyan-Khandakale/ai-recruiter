const { loadPromptSpec } = require("../utils/specLoader");

async function runInterviewAgent({ candidate, job, hiringSpec }) {
  // TODO: Build the interview questions from the required skills, the coding tasks, the
  // TODO: round count, and the rubric levels from the interview prompt spec.
  throw new Error("Interview agent is not implemented yet");
}

module.exports = { runInterviewAgent };

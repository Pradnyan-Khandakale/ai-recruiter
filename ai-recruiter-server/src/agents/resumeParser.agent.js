const fs = require("fs");
const { PDFParse } = require("pdf-parse");
const { loadPromptSpec } = require("../utils/specLoader");

function uniqueSkills(skills) {
  // TODO: De-duplicate the skills case-insensitively and drop empty values.
  return [];
}

async function extractResumeText(filePath) {
  // TODO: Read the PDF and return its text, falling back to the raw buffer string.
  return "";
}

async function runResumeParser({ candidate, filePath, hiringSpec }) {
  // TODO: Extract the resume text, detect the known skills from the prompt spec and job,
  // TODO: parse the years of experience, education, and projects, and return
  // TODO: { success, data: { name, skills, experience, education, projects } }.
  throw new Error("Resume parser agent is not implemented yet");
}

module.exports = { runResumeParser };

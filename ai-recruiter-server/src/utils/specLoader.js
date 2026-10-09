const fs = require("fs");
const path = require("path");

// Check both possible spec locations (root/specs or server/specs)
const possibleRoots = [
  path.join(__dirname, "..", "..", "..", "specs"),
  path.join(__dirname, "..", "..", "specs")
];

function getSpecsRoot() {
  for (const root of possibleRoots) {
    if (fs.existsSync(root)) {
      return root;
    }
  }
  return possibleRoots[0];
}

const cache = new Map();

function readSpec(relativePath) {
  if (cache.has(relativePath)) {
    return cache.get(relativePath);
  }

  const root = getSpecsRoot();
  const resolvedPath = path.resolve(root, relativePath);

  // Security check: reject path traversal
  if (!resolvedPath.startsWith(path.resolve(root))) {
    throw new Error(`Invalid spec path traversal attempt: ${relativePath}`);
  }

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(resolvedPath, "utf-8");
    const parsed = JSON.parse(raw);
    cache.set(relativePath, parsed);
    return parsed;
  } catch (err) {
    console.error(`Failed to read spec ${relativePath}:`, err.message);
    return null;
  }
}

function loadHiringSpec(specId = "frontend-developer") {
  const spec = readSpec(`hiring/${specId}.json`);
  if (spec) return spec;

  return {
    role: "Frontend Developer",
    required_skills: ["React", "JavaScript", "CSS"],
    preferred_skills: ["Next.js", "Tailwind CSS"],
    minimum_score: 75,
    interview_rounds: 2
  };
}

function loadWorkflowSpec(specId = "default-hiring-workflow") {
  const spec = readSpec(`workflow/${specId}.json`);
  if (spec) return spec;

  return {
    workflow: [
      "resume_parser",
      "embedding_agent",
      "matching_agent",
      "shortlisting_agent",
      "human_approval",
      "interview_agent",
      "email_agent"
    ]
  };
}

function loadRetryPolicy() {
  const spec = readSpec("system/retry-policy.json");
  if (spec) return spec;

  return {
    max_retries: 3,
    retry_delay_ms: 5000
  };
}

function loadShortlistingRules() {
  const spec = readSpec("evaluation/shortlisting-rules.json");
  if (spec) return spec;

  return {
    decisions: [
      { status: "shortlisted", minimum_score: 80, recommendation: "Shortlist candidate" },
      { status: "hold", minimum_score: 60, recommendation: "Hold for review" },
      { status: "rejected", minimum_score: 0, recommendation: "Reject candidate" }
    ]
  };
}

function loadRagSpec() {
  const spec = readSpec("evaluation/rag-retrieval.json");
  if (spec) return spec;

  return {
    top_k: 5,
    minimum_similarity: 0.75
  };
}

function loadPromptSpec(name) {
  const spec = readSpec(`prompts/${name}.json`);
  if (spec) return spec;

  return {
    name,
    weights: {
      required_skills: 60,
      preferred_skills: 25,
      experience: 15
    }
  };
}

function loadEmailSpec(name) {
  const spec = readSpec(`email/${name}.json`);
  if (spec) return spec;

  return {
    name,
    subject: "Update regarding your application"
  };
}

function loadNodeStateSpec() {
  const spec = readSpec("workflow/node-states.json");
  if (spec) return spec;

  return {
    running: "blue",
    success: "green",
    failed: "red",
    waiting_approval: "yellow"
  };
}

module.exports = {
  readSpec,
  loadHiringSpec,
  loadWorkflowSpec,
  loadRetryPolicy,
  loadShortlistingRules,
  loadRagSpec,
  loadPromptSpec,
  loadEmailSpec,
  loadNodeStateSpec
};

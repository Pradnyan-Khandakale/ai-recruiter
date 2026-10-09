const { runShortlistingAgent } = require("../src/agents/shortlisting.agent");
const { runMatchingAgent } = require("../src/agents/matching.agent");
const { runResumeParser } = require("../src/agents/resumeParser.agent");
const { runEmbeddingAgent } = require("../src/agents/embedding.agent");
const { runInterviewAgent } = require("../src/agents/interview.agent");
const { runEmailAgent } = require("../src/agents/email.agent");
const { env } = require("../src/config/env");

const originalGeminiKey = env.geminiApiKey;
const originalQdrantKey = env.qdrantApiKey;
const originalQdrantUrl = env.qdrantUrl;

beforeAll(() => {
  env.geminiApiKey = "";
  env.qdrantApiKey = "";
  env.qdrantUrl = "http://localhost:6333";
});

afterAll(() => {
  env.geminiApiKey = originalGeminiKey;
  env.qdrantApiKey = originalQdrantKey;
  env.qdrantUrl = originalQdrantUrl;
});

test("shortlisting agent returns serializable JSON", async () => {
  const result = await runShortlistingAgent({
    matching: { data: { match_score: 85, missing_skills: [] } }
  });

  expect(result.success).toBe(true);
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
});

test("shortlisting agent assigns correct statuses based on score thresholds", async () => {
  const shortlisted = await runShortlistingAgent({
    matching: { data: { match_score: 85, missing_skills: [] } }
  });
  expect(shortlisted.data.status).toBe("shortlisted");
  expect(shortlisted.data.recommendation).toBe("Shortlist candidate");

  const hold = await runShortlistingAgent({
    matching: { data: { match_score: 70, missing_skills: ["Tailwind CSS"] } }
  });
  expect(hold.data.status).toBe("hold");
  expect(hold.data.recommendation).toBe("Hold for review");

  const rejected = await runShortlistingAgent({
    matching: { data: { match_score: 45, missing_skills: ["React", "CSS"] } }
  });
  expect(rejected.data.status).toBe("rejected");
  expect(rejected.data.recommendation).toBe("Reject candidate");
});

test("shortlisting agent handles malformed or missing input safely", async () => {
  const empty = await runShortlistingAgent({});
  expect(empty.success).toBe(true);
  expect(empty.data.status).toBe("rejected");
  expect(empty.data.match_score).toBe(0);
});

test("matching agent computes score and structure from resume and specs", async () => {
  const result = await runMatchingAgent({
    parsedResume: { skills: ["React", "JavaScript", "CSS"], experience: 3 },
    hiringSpec: {
      role: "Frontend Developer",
      required_skills: ["React", "JavaScript", "CSS"],
      preferred_skills: ["Next.js"],
      min_experience: 2
    },
    ragContext: [{ chunk: 1 }, { chunk: 2 }]
  });

  expect(result.success).toBe(true);
  expect(result.data.match_score).toBeGreaterThanOrEqual(75);
  expect(result.data.rag_context_count).toBe(2);
});

test("interview agent generates questions, coding tasks, and rubrics", async () => {
  const result = await runInterviewAgent({
    candidate: { name: "John Doe" },
    job: { title: "Frontend Developer" },
    hiringSpec: { required_skills: ["React", "JavaScript"], interview_rounds: 2 }
  });

  expect(result.success).toBe(true);
  expect(result.data.interview_rounds).toBe(2);
  expect(result.data.questions.length).toBe(2);
  expect(result.data.coding_tasks.length).toBe(2);
  expect(result.data.evaluation_rubrics.length).toBe(3);
});

test("email agent falls back cleanly when Resend key is missing", async () => {
  const result = await runEmailAgent({
    candidate: { name: "Alice", email: "alice@example.com" },
    job: { title: "Software Engineer" },
    shortlisting: { data: { status: "shortlisted" } }
  });

  expect(result.success).toBe(true);
  expect(result.provider).toBe("fallback");
  expect(result.data.to).toBe("alice@example.com");
  expect(result.data.subject).toMatch(/Software Engineer/i);
});

test("embedding agent produces storage result without throwing", async () => {
  const result = await runEmbeddingAgent({
    candidate: { _id: "cand123", job_id: "job456" },
    parsedResume: { name: "Bob", skills: ["Python"], experience: 4 }
  });

  expect(result.success).toBe(true);
  expect(result.data.stored).toBeGreaterThan(0);
  expect(result.data.dimensions).toBe(384);
  expect(result.data.model).toBe("BAAI/bge-small-en-v1.5");
  expect(["qdrant", "in-memory-fallback", "memory"]).toContain(result.data.provider);
});

test("resume parser agent extracts structured data from real PDF bytes", async () => {
  const fs = require("fs");
  const path = require("path");
  const fixturePath = path.join(__dirname, "fixture-resume.pdf");
  fs.writeFileSync(
    fixturePath,
    "%PDF-1.4\nJohn Doe Resume\nSkills: React, JavaScript, Node.js\n4 years of experience\nEducation: B.Tech\nProjects: Built scalable microservice\n%%EOF"
  );

  try {
    const result = await runResumeParser({
      candidate: { name: "John Doe" },
      filePath: fixturePath,
      hiringSpec: { required_skills: ["React", "JavaScript"], preferred_skills: ["Node.js"] }
    });

    expect(result.success).toBe(true);
    expect(result.data.skills).toContain("React");
    expect(result.data.skills).toContain("JavaScript");
    expect(result.data.skills).toContain("Node.js");
    expect(result.data.experience).toBe(4);
    expect(result.data.education).toBe("B.Tech");
  } finally {
    if (fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);
  }
});

test("resume parser agent fails with controlled error on empty or corrupted PDF", async () => {
  const fs = require("fs");
  const path = require("path");
  const corruptPath = path.join(__dirname, "corrupt-resume.pdf");
  fs.writeFileSync(corruptPath, "not-a-pdf-header");

  try {
    const corruptResult = await runResumeParser({
      candidate: { name: "Test Candidate" },
      filePath: corruptPath,
      hiringSpec: { required_skills: ["React"] }
    });

    expect(corruptResult.success).toBe(false);
    expect(corruptResult.error).toMatch(/valid PDF|header/i);

    const missingResult = await runResumeParser({
      candidate: { name: "Test Candidate" },
      filePath: "non-existent-resume.pdf",
      hiringSpec: { required_skills: ["React"] }
    });
    expect(missingResult.success).toBe(false);
    expect(missingResult.error).toMatch(/does not exist/i);
  } finally {
    if (fs.existsSync(corruptPath)) fs.unlinkSync(corruptPath);
  }
});

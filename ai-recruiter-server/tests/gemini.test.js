const { z } = require("zod");
const { env } = require("../src/config/env");
const {
  createGeminiClient,
  generateText,
  generateStructuredJson,
  validateGeminiConnection,
  cleanJsonOutput,
  sanitizeError
} = require("../src/services/gemini.service");
const { runResumeParser } = require("../src/agents/resumeParser.agent");
const { runMatchingAgent } = require("../src/agents/matching.agent");
const { runShortlistingAgent } = require("../src/agents/shortlisting.agent");
const { runInterviewAgent } = require("../src/agents/interview.agent");
const { runEmailAgent } = require("../src/agents/email.agent");
const fs = require("fs");
const path = require("path");

describe("Google Gemini Service & Agent Integration Tests", () => {
  const originalApiKey = env.geminiApiKey;
  const originalModel = env.geminiModel;

  beforeEach(() => {
    // Keep unit tests isolated from external networks by default
    env.geminiApiKey = "";
    delete process.env.REQUIRE_GEMINI;
  });

  afterAll(() => {
    env.geminiApiKey = originalApiKey;
    env.geminiModel = originalModel;
    delete process.env.REQUIRE_GEMINI;
  });

  describe("Client Initialization & Configuration", () => {
    test("creates GoogleGenAI client when apiKey is provided", () => {
      const client = createGeminiClient({ apiKey: "AIzaSyFakeKeyForTesting1234567890" });
      expect(client).toBeDefined();
      expect(client.models).toBeDefined();
    });

    test("returns null when apiKey is missing", () => {
      const client = createGeminiClient({ apiKey: "" });
      expect(client).toBeNull();
    });
  });

  describe("Fallback Behavior & Strict Mode", () => {
    test("returns clean fallback response when apiKey is missing in non-strict mode", async () => {
      const res = await generateText({ prompt: "Hello", client: null, strict: false });
      expect(res.success).toBe(true);
      expect(res.isFallback).toBe(true);
      expect(res.provider).toBe("fallback");
      expect(res.warning).toMatch(/fallback mode active/i);
    });

    test("throws GEMINI_KEY_MISSING error when apiKey is missing in strict mode", async () => {
      await expect(
        generateText({ prompt: "Hello", client: null, strict: true })
      ).rejects.toThrow(/Google Gemini API key is missing and strict mode is enabled/i);
    });

    test("structured JSON generation returns fallback in non-strict mode when key is missing", async () => {
      const res = await generateStructuredJson({ prompt: "Generate JSON", client: null, strict: false });
      expect(res.success).toBe(false);
      expect(res.isFallback).toBe(true);
      expect(res.provider).toBe("fallback");
    });

    test("structured JSON generation throws in strict mode when key is missing", async () => {
      await expect(
        generateStructuredJson({ prompt: "Generate JSON", client: null, strict: true })
      ).rejects.toThrow(/Google Gemini API key is missing/i);
    });
  });

  describe("Text Generation & Error Handling", () => {
    test("generates text successfully using mocked Gemini client", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: "Hello! I am Google Gemini."
          })
        }
      };

      const res = await generateText({
        prompt: "Hello Gemini",
        client: mockClient,
        model: "gemini-2.5-flash"
      });

      expect(res.success).toBe(true);
      expect(res.text).toBe("Hello! I am Google Gemini.");
      expect(res.provider).toBe("gemini");
      expect(res.isFallback).toBe(false);
      expect(mockClient.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gemini-2.5-flash",
          contents: "Hello Gemini"
        }),
        expect.any(Object)
      );
    });

    test("handles timeout and abort signal cleanly", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockImplementation(() => {
            const abortError = new Error("This operation was aborted");
            abortError.name = "AbortError";
            return Promise.reject(abortError);
          })
        }
      };

      const res = await generateText({
        prompt: "Slow request",
        client: mockClient,
        timeoutMs: 50,
        strict: false
      });

      expect(res.success).toBe(false);
      expect(res.isFallback).toBe(true);
      expect(res.error).toMatch(/timed out/i);
    });

    test("throws typed error on timeout in strict mode", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockImplementation(() => {
            const abortError = new Error("This operation was aborted");
            abortError.name = "AbortError";
            return Promise.reject(abortError);
          })
        }
      };

      await expect(
        generateText({
          prompt: "Slow request",
          client: mockClient,
          timeoutMs: 50,
          strict: true
        })
      ).rejects.toThrow(/timed out/i);
    });

    test("throws GEMINI_API_ERROR in strict mode on provider failure", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockRejectedValue(new Error("500 Internal Server Error"))
        }
      };

      await expect(
        generateText({
          prompt: "Fail request",
          client: mockClient,
          strict: true
        })
      ).rejects.toThrow(/Gemini text generation failed/i);
    });
  });

  describe("Structured JSON Output & Zod Schema Validation", () => {
    test("parses structured JSON and validates against Zod schema", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({ name: "Alex Doe", score: 92 })
          })
        }
      };

      const testSchema = z.object({
        name: z.string(),
        score: z.number()
      });

      const res = await generateStructuredJson({
        prompt: "Extract candidate",
        client: mockClient,
        schema: testSchema
      });

      expect(res.success).toBe(true);
      expect(res.data).toEqual({ name: "Alex Doe", score: 92 });
      expect(res.provider).toBe("gemini");
    });

    test("strips markdown code fences from model response before parsing", async () => {
      const fencedOutput = "```json\n{\"skills\": [\"React\", \"TypeScript\"]}\n```";
      const cleaned = cleanJsonOutput(fencedOutput);
      expect(cleaned).toBe('{"skills": ["React", "TypeScript"]}');

      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: fencedOutput
          })
        }
      };

      const schema = z.object({ skills: z.array(z.string()) });
      const res = await generateStructuredJson({
        prompt: "Extract skills",
        client: mockClient,
        schema
      });

      expect(res.success).toBe(true);
      expect(res.data.skills).toEqual(["React", "TypeScript"]);
    });

    test("handles malformed JSON output safely", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: "This is not valid JSON at all"
          })
        }
      };

      const res = await generateStructuredJson({
        prompt: "Broken output",
        client: mockClient,
        strict: false
      });

      expect(res.success).toBe(false);
      expect(res.isFallback).toBe(true);
      expect(res.error).toMatch(/Malformed JSON/i);
    });

    test("fails safely when output violates Zod schema", async () => {
      const mockClient = {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({ score: "not-a-number" })
          })
        }
      };

      const schema = z.object({ score: z.number() });
      const res = await generateStructuredJson({
        prompt: "Wrong type",
        client: mockClient,
        schema,
        strict: false
      });

      expect(res.success).toBe(false);
      expect(res.isFallback).toBe(true);
    });
  });

  describe("Security: Secret Masking and Privacy", () => {
    test("redacts raw API keys from error messages", () => {
      const fakeKey = "AIzaSyTestSecretKey_999999999999999999";
      env.geminiApiKey = fakeKey;

      const rawError = new Error(`Request to https://generativelanguage.googleapis.com/v1beta/models?key=${fakeKey} failed`);
      const sanitized = sanitizeError(rawError);

      expect(sanitized).not.toContain(fakeKey);
      expect(sanitized).toMatch(/REDACTED/i);
    });

    test("redacts typical AIza pattern even if not in env", () => {
      const errorMsg = "Permission denied for key AIzaSyABCDEF1234567890ABCDEF12345678901";
      const sanitized = sanitizeError(errorMsg);
      expect(sanitized).not.toContain("AIzaSyABCDEF1234567890ABCDEF12345678901");
      expect(sanitized).toMatch(/REDACTED/i);
    });
  });

  describe("Agent Service Integration with Gemini", () => {
    test("resume parser agent extracts structured data cleanly", async () => {
      const fixturePdf = path.join(__dirname, "gemini-parser-fixture.pdf");
      fs.writeFileSync(
        fixturePdf,
        "%PDF-1.4\nJordan Smith\nSenior Full Stack Developer\nSkills: React, Node.js, Python, PostgreSQL\n6 years of experience\nEducation: M.S. Computer Science\n%%EOF"
      );

      try {
        const result = await runResumeParser({
          candidate: { name: "Jordan Smith" },
          filePath: fixturePdf,
          hiringSpec: { required_skills: ["React", "Node.js"] }
        });

        expect(result.success).toBe(true);
        expect(result.data.skills).toContain("React");
        expect(result.data.skills).toContain("Node.js");
        expect(result.data.experience).toBeGreaterThanOrEqual(6);
        expect(result.data.education).toMatch(/Computer Science|M\.S/i);
      } finally {
        if (fs.existsSync(fixturePdf)) fs.unlinkSync(fixturePdf);
      }
    });

    test("matching agent computes score and structure cleanly", async () => {
      const result = await runMatchingAgent({
        parsedResume: { skills: ["React", "JavaScript", "CSS"], experience: 4 },
        hiringSpec: {
          role: "Frontend Engineer",
          required_skills: ["React", "JavaScript"],
          preferred_skills: ["CSS"],
          min_experience: 2
        },
        ragContext: [{ chunkText: "Candidate has 4 years React experience" }]
      });

      expect(result.success).toBe(true);
      expect(result.data.match_score).toBeGreaterThanOrEqual(75);
      expect(result.data.explanation).toBeDefined();
      expect(typeof result.data.explanation).toBe("string");
      expect(result.data.rag_context_count).toBe(1);
    });

    test("shortlisting agent returns status, recommendation, and rationale", async () => {
      const res = await runShortlistingAgent({
        matching: { data: { match_score: 88, missing_skills: [] } },
        candidate: { name: "Test Candidate", id: "cand_123" },
        job: { title: "Software Engineer", id: "job_456" }
      });

      expect(res.success).toBe(true);
      expect(res.data.status).toBe("shortlisted");
      expect(res.data.recommendation).toBe("Shortlist candidate");
      expect(res.data.rationale).toBeDefined();
      expect(typeof res.data.rationale).toBe("string");
    });

    test("interview agent generates questions and rubrics adhering to schema", async () => {
      const res = await runInterviewAgent({
        candidate: { name: "Morgan" },
        job: { title: "Backend Engineer" },
        hiringSpec: { required_skills: ["Node.js", "Express"], interview_rounds: 3 }
      });

      expect(res.success).toBe(true);
      expect(res.data.interview_rounds).toBe(3);
      expect(res.data.questions.length).toBeGreaterThan(0);
      expect(res.data.coding_tasks.length).toBeGreaterThan(0);
      expect(res.data.evaluation_rubrics.length).toBeGreaterThan(0);
    });

    test("email agent formats personalized candidate email body", async () => {
      const res = await runEmailAgent({
        candidate: { name: "Taylor", email: "taylor@example.com" },
        job: { title: "Full Stack Developer" },
        shortlisting: { data: { status: "shortlisted" } }
      });

      expect(res.success).toBe(true);
      expect(res.data.to).toBe("taylor@example.com");
      expect(res.data.subject).toMatch(/Full Stack Developer/i);
      expect(res.data.body).toBeDefined();
    });
  });

  describe("Connection Validation Helper", () => {
    test("validateGeminiConnection reports FAIL — CONFIGURATION when apiKey is missing", async () => {
      const res = await validateGeminiConnection({ apiKey: "" });
      expect(res.ok).toBe(false);
      expect(res.status).toBe("FAIL — CONFIGURATION");
      expect(res.code).toBe("MISSING_API_KEY");
    });

    test("validateGeminiConnection reports FAIL — AUTHENTICATION when service rejects key", async () => {
      const res = await validateGeminiConnection({
        apiKey: "AIzaInvalidKeyForAuthTest"
      });
      expect(res.ok).toBe(false);
      expect(["FAIL — AUTHENTICATION", "FAIL — CONNECTIVITY"]).toContain(res.status);
    });
  });
});

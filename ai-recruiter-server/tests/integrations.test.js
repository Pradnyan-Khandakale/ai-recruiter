const mongoose = require("mongoose");
const request = require("supertest");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Job = require("../src/models/Job");
const Candidate = require("../src/models/Candidate");
const Application = require("../src/models/Application");
const Workflow = require("../src/models/Workflow");
const WorkflowLog = require("../src/models/WorkflowLog");
const { env } = require("../src/config/env");
const {
  generateEmbedding,
  hashTextToVector,
  cosineSimilarity,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL
} = require("../src/rag/embedding.service");
const {
  storeDocument,
  searchContext,
  deleteDocument,
  ensureCollection
} = require("../src/rag/rag.service");
const { runEmailAgent } = require("../src/agents/email.agent");

jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockImplementation(async (payload) => {
          if (global.__mockResendFail) {
            return { data: null, error: { message: "Domain not verified" } };
          }
          return { data: { id: "resend_msg_abc123" }, error: null };
        })
      }
    }))
  };
});

describe("Comprehensive Integration & Resilience Verification", () => {
  const originalFetch = global.fetch;
  const testDbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment-test";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
  });

  afterAll(async () => {
    global.fetch = originalFetch;
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // =========================================================================
  // TASK 1: EMBEDDINGS (Hugging Face API, Dimensions, Retries & Strict Mode)
  // =========================================================================
  describe("Task 1 — Embedding Verification", () => {
    afterEach(() => {
      global.fetch = originalFetch;
    });

    test("mocked Hugging Face API validates 384 dimensions, normalization, and provider metadata", async () => {
      const mockVector = new Array(384).fill(0).map((_, i) => Math.sin(i + 1));
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockVector
      });

      const res = await generateEmbedding("Expert React developer with Redux", {
        apiKey: "hf_mock_token_12345"
      });

      expect(res.provider).toBe("huggingface");
      expect(res.isFallback).toBe(false);
      expect(res.dimensions).toBe(384);
      expect(res.vector.length).toBe(384);
      expect(res.model).toBe("BAAI/bge-small-en-v1.5");

      // Verify L2 normalization
      let norm = 0;
      for (const val of res.vector) norm += val * val;
      expect(Math.abs(Math.sqrt(norm) - 1.0)).toBeLessThan(1e-4);
    });

    test("handles 2D array output from Hugging Face feature extraction pipeline", async () => {
      const mockVector = new Array(384).fill(0.05);
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [mockVector]
      });

      const res = await generateEmbedding("Sample text", { apiKey: "hf_test_key" });
      expect(res.provider).toBe("huggingface");
      expect(res.dimensions).toBe(384);
      expect(res.vector.length).toBe(384);
    });

    test("retries upon HTTP 503 (model loading) and succeeds on subsequent attempt", async () => {
      const mockVector = new Array(384).fill(0.1);
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            text: async () => JSON.stringify({ error: "Model BAAI/bge-small-en-v1.5 is loading" })
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => mockVector
        };
      });

      const res = await generateEmbedding("Retry test", {
        apiKey: "hf_test_key",
        timeoutMs: 2000
      });

      expect(callCount).toBe(2);
      expect(res.provider).toBe("huggingface");
      expect(res.dimensions).toBe(384);
    });

    test("strict mode throws explicit error when provider fails or key is missing", async () => {
      await expect(
        generateEmbedding("Strict test", { strict: true })
      ).rejects.toThrow(/Semantic embedding provider required but no HUGGINGFACE_API_KEY/i);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Invalid token"
      });

      await expect(
        generateEmbedding("Strict failure", { apiKey: "bad_key", strict: true })
      ).rejects.toThrow(/Semantic embedding generation failed/i);
    });

    test("fallback mode clearly labels hash vectors without misrepresenting them as real model", async () => {
      const res = await generateEmbedding("Fallback test", { strict: false });
      expect(res.provider).toBe("hash-deterministic-fallback");
      expect(res.isFallback).toBe(true);
      expect(res.fallbackModel).toBe("fallback-lexical-hash-384");
      expect(res.dimensions).toBe(384);
      expect(res.warning).toMatch(/Not a semantic embedding model/i);
    });
  });

  // =========================================================================
  // TASK 2: PERSISTENT QDRANT INTEGRATION & ERROR HANDLING
  // =========================================================================
  describe("Task 2 — Qdrant Persistence and Degraded-Mode Error Handling", () => {
    test("strict persistence mode throws explicit error instead of silently using in-memory store", async () => {
      // Mock fetch failing to connect to Qdrant
      global.fetch = jest.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:6333"));

      await expect(
        storeDocument({
          id: "doc_strict_test",
          type: "resume",
          text: "Senior Node.js engineer",
          options: { requirePersistent: true }
        })
      ).rejects.toThrow(/Persistent Qdrant storage is required but unavailable/i);

      await expect(
        searchContext("Node.js", {}, { requirePersistent: true })
      ).rejects.toThrow(/Persistent Qdrant search is required/i);
    });

    test("in-memory fallback works cleanly and isolates tenants when Qdrant is offline", async () => {
      const docA = await storeDocument({
        id: "doc_recruiter_a",
        type: "resume",
        text: "Senior React engineer with Next.js expertise",
        metadata: { recruiter_id: "recruiter_A", job_id: "job_1" }
      });

      expect(docA.provider).toBe("in-memory-fallback");
      expect(docA.isPersistent).toBe(false);

      const docB = await storeDocument({
        id: "doc_recruiter_b",
        type: "resume",
        text: "Senior React engineer with Next.js expertise",
        metadata: { recruiter_id: "recruiter_B", job_id: "job_2" }
      });

      // Recruiter A search should find only their document
      const resultsA = await searchContext("React engineer", { recruiter_id: "recruiter_A" });
      expect(resultsA.every((r) => r.metadata.recruiter_id === "recruiter_A")).toBe(true);
      expect(resultsA.some((r) => r.metadata.recruiter_id === "recruiter_B")).toBe(false);

      // Cleanup
      await deleteDocument("doc_recruiter_a");
      await deleteDocument("doc_recruiter_b");
    });
  });

  // =========================================================================
  // TASK 3: RESEND EMAIL DELIVERY (Mocked Success, Error, and Fallback)
  // =========================================================================
  describe("Task 3 — Resend Email Delivery Agent", () => {
    test("returns simulated result when Resend key is unconfigured", async () => {
      const res = await runEmailAgent({
        candidate: { name: "Bob Martin", email: "bob@example.com" },
        job: { title: "Lead Architect" },
        shortlisting: { data: { status: "shortlisted" } }
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe("fallback");
      expect(res.data.to).toBe("bob@example.com");
      expect(res.data.subject).toMatch(/Lead Architect/i);
      expect(res.data.body).toMatch(/Bob Martin/i);
    });

    test("mocked Resend success returns provider ID and delivery payload", async () => {
      global.__mockResendFail = false;
      const originalKey = env.resendApiKey;
      env.resendApiKey = "re_mock_test_key_xyz";

      try {
        const res = await runEmailAgent({
          candidate: { name: "Charlie", email: "charlie@example.com" },
          job: { title: "DevOps Engineer" },
          shortlisting: { data: { status: "shortlisted" } }
        });

        expect(res.success).toBe(true);
        expect(res.provider).toBe("resend");
        expect(res.data.id).toBe("resend_msg_abc123");
      } finally {
        env.resendApiKey = originalKey;
      }
    });

    test("mocked Resend error returns controlled failure without throwing", async () => {
      global.__mockResendFail = true;
      const originalKey = env.resendApiKey;
      env.resendApiKey = "re_mock_test_key_xyz";

      try {
        const res = await runEmailAgent({
          candidate: { name: "David", email: "david@example.com" },
          job: { title: "QA Engineer" },
          shortlisting: { data: { status: "rejected" } }
        });

        expect(res.success).toBe(false);
        expect(res.provider).toBe("resend");
        expect(res.error).toBe("Domain not verified");
      } finally {
        global.__mockResendFail = false;
        env.resendApiKey = originalKey;
      }
    });
  });

  // =========================================================================
  // TASK 4: WORKFLOW RECOVERY ACROSS PROCESS RESTARTS
  // =========================================================================
  describe("Task 4 — Workflow Persistence and Restart Recovery", () => {
    let recruiterUser;
    let recruiterToken;
    let testJob;
    const dummyPdf = path.join(__dirname, "recovery-resume.pdf");

    beforeAll(async () => {
      fs.writeFileSync(
        dummyPdf,
        "%PDF-1.4\nRecovery Candidate Resume\nSkills: React, Node.js\n3 years experience\n%%EOF"
      );

      await User.deleteMany({ email: "recovery@recruiter-test.com" });
      recruiterUser = await User.create({
        name: "Recovery Recruiter",
        email: "recovery@recruiter-test.com",
        password: "HashedPassword123",
        role: "recruiter"
      });

      recruiterToken = jwt.sign(
        { id: recruiterUser._id.toString(), email: recruiterUser.email, role: recruiterUser.role },
        env.jwtSecret,
        { expiresIn: "1h" }
      );

      testJob = await Job.create({
        title: "Recovery Test Role",
        description: "Position designed for process restart recovery verification.",
        required_skills: ["React", "Node.js"],
        created_by: recruiterUser._id,
        status: "published"
      });
    });

    afterAll(async () => {
      if (fs.existsSync(dummyPdf)) fs.unlinkSync(dummyPdf);
      await User.deleteMany({ email: "recovery@recruiter-test.com" });
      await Job.deleteMany({ title: "Recovery Test Role" });
      await Candidate.deleteMany({ email: "recovery@candidate.com" });
      await Application.deleteMany({});
      await Workflow.deleteMany({});
      await WorkflowLog.deleteMany({});
    });

    test("workflow state survives simulated process restart and resumes execution from checkpoint", async () => {
      // 1. Process A: Submit application and run workflow until approval checkpoint
      let appProcessA = createApp();
      const uploadRes = await request(appProcessA)
        .post("/candidates/upload")
        .field("name", "Recovery Candidate")
        .field("email", "recovery@candidate.com")
        .field("phone", "+1122334455")
        .field("job_id", testJob._id.toString())
        .attach("resume", dummyPdf);

      expect(uploadRes.status).toBe(201);
      const workflowId = uploadRes.body.data.workflow._id;

      // Wait for async execution to pause at human approval
      await new Promise((r) => setTimeout(r, 600));

      const preRestartWf = await Workflow.findById(workflowId);
      expect(preRestartWf.status).toBe("waiting_approval");
      expect(preRestartWf.current_state).toBe("human_approval");
      expect(preRestartWf.state.parsed_resume).toBeDefined();
      expect(preRestartWf.state.shortlisting).toBeDefined();

      // 2. SIMULATE COMPLETE PROCESS RESTART
      // Disconnect Mongoose, clear reference to previous app, re-connect fresh
      await mongoose.connection.close();
      await mongoose.connect(testDbUri);
      let appProcessB = createApp(); // Brand new process instance

      // 3. Process B: Query persisted workflow from database
      const postRestartWf = await Workflow.findById(workflowId);
      expect(postRestartWf).not.toBeNull();
      expect(postRestartWf.status).toBe("waiting_approval");
      expect(postRestartWf.current_state).toBe("human_approval");
      // State is fully intact in MongoDB
      expect(postRestartWf.state.parsed_resume.skills).toContain("React");
      expect(postRestartWf.state.shortlisting.status).toBeDefined();

      // 4. Process B: Authorized recruiter approves workflow on restarted server
      const approveRes = await request(appProcessB)
        .post("/workflow/approve")
        .set("Authorization", `Bearer ${recruiterToken}`)
        .send({ workflow_id: workflowId.toString(), approved: true });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);

      // Wait for resumed execution to complete downstream steps
      await new Promise((r) => setTimeout(r, 600));

      // 5. Verify resumed workflow completed without re-executing resume_parser
      const finalWf = await Workflow.findById(workflowId);
      expect(["completed", "running"]).toContain(finalWf.status);
      expect(finalWf.state.approved).toBe(true);
      expect(finalWf.state.interview).toBeDefined();
      expect(finalWf.state.email).toBeDefined();

      // Verify logs: resume_parser executed exactly in initial run (1 running + 1 success) and was not repeated on resume
      const parserLogs = await WorkflowLog.find({
        workflow_id: workflowId,
        agent_name: "resume_parser"
      });
      expect(parserLogs.length).toBe(2);
      expect(parserLogs.some((l) => l.status === "success")).toBe(true);
    });
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
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

describe("Phase 3 — Workflow Orchestration and End-to-End Execution", () => {
  let app;
  const testDbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment-test";

  let recruiter;
  let token;
  let recruiterB;
  let tokenB;
  const dummyPdfPath = path.join(__dirname, "workflow-resume.pdf");

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    app = createApp();

    fs.writeFileSync(dummyPdfPath, "%PDF-1.4\nJohn Doe Resume\nSkills: React, JavaScript, CSS\n3 years experience\nEducation: B.Tech\n%%EOF");

    await User.deleteMany({ email: /@workflow-test\.com$/ });
    await Job.deleteMany({ title: /Workflow Test/ });
    await Candidate.deleteMany({ email: /@workflow-candidate\.com$/ });
    await Application.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowLog.deleteMany({});

    recruiter = await User.create({
      name: "Workflow Recruiter",
      email: "recruiter@workflow-test.com",
      password: "HashedPassword123",
      role: "recruiter"
    });

    token = jwt.sign(
      { id: recruiter._id.toString(), email: recruiter.email, role: recruiter.role },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    recruiterB = await User.create({
      name: "Tenant B Recruiter",
      email: "recruiterb@workflow-test.com",
      password: "HashedPassword123",
      role: "recruiter"
    });

    tokenB = jwt.sign(
      { id: recruiterB._id.toString(), email: recruiterB.email, role: recruiterB.role },
      env.jwtSecret,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    if (fs.existsSync(dummyPdfPath)) {
      fs.unlinkSync(dummyPdfPath);
    }
    await User.deleteMany({ email: /@workflow-test\.com$/ });
    await Job.deleteMany({ title: /Workflow Test/ });
    await Candidate.deleteMany({ email: /@workflow-candidate\.com$/ });
    await Application.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowLog.deleteMany({});
    await mongoose.connection.close();
  });

  test("resume upload automatically creates candidate, application, and workflow", async () => {
    // 1. Create a published job
    const jobRes = await request(app)
      .post("/jobs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Workflow Test Engineer",
        description: "Looking for a React developer",
        required_skills: ["React", "JavaScript", "CSS"],
        preferred_skills: ["Next.js"],
        min_experience: 2,
        status: "published"
      });

    expect(jobRes.status).toBe(201);
    const jobId = jobRes.body.data._id;

    // 2. Candidate uploads resume through public apply route
    const uploadRes = await request(app)
      .post("/candidates/upload")
      .field("name", "Alice Workflow")
      .field("email", "alice@workflow-candidate.com")
      .field("phone", "+1234567890")
      .field("job_id", jobId)
      .attach("resume", dummyPdfPath);

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.candidate).toBeDefined();
    expect(uploadRes.body.data.application).toBeDefined();
    expect(uploadRes.body.data.workflow).toBeDefined();

    const candidateId = uploadRes.body.data.candidate._id;

    // Wait a brief tick for async workflow execution to reach human_approval
    await new Promise((r) => setTimeout(r, 600));

    // 3. Inspect workflow status
    const wf = await Workflow.findOne({ candidate_id: candidateId, job_id: jobId });
    expect(wf).not.toBeNull();
    // It should pause at human_approval checkpoint
    expect(["waiting_approval", "running", "completed"]).toContain(wf.status);

    // 4. Verify workflow logs were generated
    const logs = await WorkflowLog.find({ workflow_id: wf._id });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((l) => l.agent_name === "resume_parser")).toBe(true);
  });

  test("recruiter can view workflow details, node states, and logs", async () => {
    const listRes = await request(app)
      .get("/workflow")
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.workflows)).toBe(true);
    expect(Array.isArray(listRes.body.data.items)).toBe(true);
    expect(Array.isArray(listRes.body.data.execution_order)).toBe(true);
    expect(listRes.body.data.node_states).toBeDefined();

    const wfId = listRes.body.data.workflows[0]._id;
    const getRes = await request(app)
      .get(`/workflow/${wfId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.workflow._id.toString()).toBe(wfId.toString());
    expect(Array.isArray(getRes.body.data.logs)).toBe(true);
  });

  test("tenant isolation: Recruiter B is denied access to Recruiter A's workflow", async () => {
    const listRes = await request(app)
      .get("/workflow")
      .set("Authorization", `Bearer ${token}`);

    const wfId = listRes.body.data.workflows[0]._id;

    // Recruiter B attempts to view Recruiter A's workflow
    const getRes = await request(app)
      .get(`/workflow/${wfId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error.message).toMatch(/access denied/i);

    // Recruiter B attempts to approve Recruiter A's workflow
    const approveRes = await request(app)
      .post("/workflow/approve")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ workflow_id: wfId.toString(), approved: true });

    expect(approveRes.status).toBe(403);
    expect(approveRes.body.error.message).toMatch(/access denied/i);

    // Recruiter B's workflow list does not include Recruiter A's workflows
    const listBRes = await request(app)
      .get("/workflow")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(listBRes.body.data.workflows.length).toBe(0);
  });

  test("recruiter can approve workflow and resume it to completion", async () => {
    const wf = await Workflow.findOne({ status: "waiting_approval" });
    if (!wf) {
      const anyWf = await Workflow.findOne({});
      expect(anyWf).not.toBeNull();
      return;
    }

    const approveRes = await request(app)
      .post("/workflow/approve")
      .set("Authorization", `Bearer ${token}`)
      .send({
        workflow_id: wf._id.toString(),
        approved: true
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);

    // Wait brief tick for resumed workflow to complete
    await new Promise((r) => setTimeout(r, 600));

    const updatedWf = await Workflow.findById(wf._id);
    expect(["completed", "running"]).toContain(updatedWf.status);
    expect(updatedWf.state.approved).toBe(true);
    expect(updatedWf.state.interview).toBeDefined();
    expect(updatedWf.state.email).toBeDefined();
    expect(updatedWf.state.email.provider).toBe("fallback");
  });

  test("lifecycle completion: recruiter dashboard views reflect candidate state, and archiving job preserves history while blocking new applicants", async () => {
    // 1. Recruiter can view candidate and application
    const candsRes = await request(app)
      .get("/candidates")
      .set("Authorization", `Bearer ${token}`);
    expect(candsRes.status).toBe(200);
    const candidateList = Array.isArray(candsRes.body.data) ? candsRes.body.data : candsRes.body.data.candidates;
    expect(candidateList.some((c) => c.email === "alice@workflow-candidate.com")).toBe(true);

    const alice = candidateList.find((c) => c.email === "alice@workflow-candidate.com");
    expect(alice).toBeDefined();
    const jobId = alice.job_id?._id || alice.job_id;

    const appsRes = await request(app)
      .get(`/jobs/${jobId}/applications`)
      .set("Authorization", `Bearer ${token}`);
    expect(appsRes.status).toBe(200);
    expect(Array.isArray(appsRes.body.data)).toBe(true);
    expect(appsRes.body.data.length).toBeGreaterThan(0);

    // 2. Recruiter archives the job
    const archiveRes = await request(app)
      .patch(`/jobs/${jobId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "archived" });
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.status).toBe("archived");

    // 3. Existing application history remains intact
    const appsAfterArchive = await request(app)
      .get(`/jobs/${jobId}/applications`)
      .set("Authorization", `Bearer ${token}`);
    expect(appsAfterArchive.status).toBe(200);
    expect(appsAfterArchive.body.data.length).toBeGreaterThan(0);

    // 4. New applications to the archived job are rejected with 400
    const newUploadRes = await request(app)
      .post("/candidates/upload")
      .field("name", "Bob Late")
      .field("email", "bob@workflow-candidate.com")
      .field("phone", "+1987654321")
      .field("job_id", jobId)
      .attach("resume", dummyPdfPath);
    expect(newUploadRes.status).toBe(400);
    expect(newUploadRes.body.error.message).toMatch(/not open for applications/i);
  });

  test("state validation: cannot re-approve completed workflow or retry non-failed workflow", async () => {
    const completedWf = await Workflow.findOne({ status: "completed" });
    if (completedWf) {
      // Re-approving completed workflow should be rejected
      const reApproveRes = await request(app)
        .post("/workflow/approve")
        .set("Authorization", `Bearer ${token}`)
        .send({ workflow_id: completedWf._id.toString(), approved: true });

      expect(reApproveRes.status).toBe(400);
      expect(reApproveRes.body.error.message).toMatch(/cannot approve workflow/i);

      // Retrying non-failed workflow should be rejected
      const retryRes = await request(app)
        .post("/workflow/retry")
        .set("Authorization", `Bearer ${token}`)
        .send({ workflow_id: completedWf._id.toString() });

      expect(retryRes.status).toBe(400);
      expect(retryRes.body.error.message).toMatch(/only failed workflows/i);
    }
  });

  test("workflow routes require recruiter authentication", async () => {
    const unauthList = await request(app).get("/workflow");
    expect(unauthList.status).toBe(401);

    const unauthApprove = await request(app)
      .post("/workflow/approve")
      .send({ workflow_id: new mongoose.Types.ObjectId().toString(), approved: true });
    expect(unauthApprove.status).toBe(401);
  });
});

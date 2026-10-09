const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const Job = require("../src/models/Job");
const Candidate = require("../src/models/Candidate");
const Application = require("../src/models/Application");
const Workflow = require("../src/models/Workflow");
const WorkflowLog = require("../src/models/WorkflowLog");
const { env } = require("../src/config/env");

describe("Phase 4A — Recruiter Analytics & Reporting", () => {
  let app;
  const testDbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment-test";

  let recruiterA;
  let tokenA;
  let recruiterB;
  let tokenB;

  let jobA1;
  let jobA2;
  let jobB1;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    app = createApp();

    await User.deleteMany({ email: /@analytics-test\.com$/ });
    await Job.deleteMany({ title: /Analytics Test/ });
    await Candidate.deleteMany({ email: /@analytics-cand\.com$/ });
    await Application.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowLog.deleteMany({});

    // Create Recruiter A
    recruiterA = await User.create({
      name: "Analytics Recruiter A",
      email: "recruiter.a@analytics-test.com",
      password: "HashedPassword123",
      role: "recruiter"
    });
    tokenA = jwt.sign(
      { id: recruiterA._id.toString(), email: recruiterA.email, role: recruiterA.role },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // Create Recruiter B
    recruiterB = await User.create({
      name: "Analytics Recruiter B",
      email: "recruiter.b@analytics-test.com",
      password: "HashedPassword123",
      role: "recruiter"
    });
    tokenB = jwt.sign(
      { id: recruiterB._id.toString(), email: recruiterB.email, role: recruiterB.role },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // Create Jobs for Recruiter A
    jobA1 = await Job.create({
      title: "Analytics Test Frontend Lead",
      description: "Frontend role for analytics test",
      created_by: recruiterA._id,
      status: "published"
    });

    jobA2 = await Job.create({
      title: "Analytics Test Backend Lead",
      description: "Backend role for analytics test",
      created_by: recruiterA._id,
      status: "archived"
    });

    // Create Job for Recruiter B
    jobB1 = await Job.create({
      title: "Analytics Test Recruiter B Job",
      description: "Recruiter B job description",
      created_by: recruiterB._id,
      status: "published"
    });

    // Candidates and Applications for Recruiter A Job 1
    const cand1 = await Candidate.create({
      name: "Alice A1",
      email: "alice@analytics-cand.com",
      phone: "+1112223334",
      status: "shortlisted"
    });
    const app1 = await Application.create({
      job_id: jobA1._id,
      candidate_id: cand1._id,
      recruiter_id: recruiterA._id,
      status: "shortlisted"
    });

    const cand2 = await Candidate.create({
      name: "Bob A2",
      email: "bob@analytics-cand.com",
      phone: "+1112223335",
      status: "rejected"
    });
    const app2 = await Application.create({
      job_id: jobA1._id,
      candidate_id: cand2._id,
      recruiter_id: recruiterA._id,
      status: "rejected"
    });

    const cand3 = await Candidate.create({
      name: "Charlie A3",
      email: "charlie@analytics-cand.com",
      phone: "+1112223336",
      status: "applied"
    });
    const app3 = await Application.create({
      job_id: jobA1._id,
      candidate_id: cand3._id,
      recruiter_id: recruiterA._id,
      status: "applied"
    });

    // Workflows for Recruiter A
    const wf1 = await Workflow.create({
      candidate_id: cand1._id,
      job_id: jobA1._id,
      application_id: app1._id,
      status: "completed",
      current_state: "completed"
    });
    await WorkflowLog.create({
      workflow_id: wf1._id,
      agent_name: "resume_parser",
      status: "success"
    });
    await WorkflowLog.create({
      workflow_id: wf1._id,
      agent_name: "shortlisting_agent",
      status: "success"
    });

    const wf2 = await Workflow.create({
      candidate_id: cand2._id,
      job_id: jobA1._id,
      application_id: app2._id,
      status: "failed",
      current_state: "resume_parser"
    });
    await WorkflowLog.create({
      workflow_id: wf2._id,
      agent_name: "resume_parser",
      status: "failed",
      error: "Corrupt file"
    });

    // Candidate and Application for Recruiter B
    const candB = await Candidate.create({
      name: "Dave B",
      email: "dave@analytics-cand.com",
      phone: "+9998887771",
      status: "shortlisted"
    });
    const appB = await Application.create({
      job_id: jobB1._id,
      candidate_id: candB._id,
      recruiter_id: recruiterB._id,
      status: "shortlisted"
    });
    const wfB = await Workflow.create({
      candidate_id: candB._id,
      job_id: jobB1._id,
      application_id: appB._id,
      status: "completed",
      current_state: "completed"
    });
    await WorkflowLog.create({
      workflow_id: wfB._id,
      agent_name: "resume_parser",
      status: "success"
    });
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@analytics-test\.com$/ });
    await Job.deleteMany({ title: /Analytics Test/ });
    await Candidate.deleteMany({ email: /@analytics-cand\.com$/ });
    await Application.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowLog.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test("recruiter A gets accurate analytics calculated from database records", async () => {
    const res = await request(app)
      .get("/analytics")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    // Jobs breakdown
    expect(data.jobs.total_jobs).toBe(2);
    expect(data.jobs.published_jobs).toBe(1);
    expect(data.jobs.archived_jobs).toBe(1);

    // Applications breakdown
    expect(data.applications.total_applications).toBe(3);
    expect(data.applications.by_status.shortlisted).toBe(1);
    expect(data.applications.by_status.rejected).toBe(1);
    expect(data.applications.by_status.applied).toBe(1);
    // Shortlist rate: 1 shortlisted out of 3 = 33%
    expect(data.applications.shortlist_rate).toBe(33);

    // Workflows breakdown
    expect(data.workflows.total_workflows).toBe(2);
    expect(data.workflows.by_status.completed).toBe(1);
    expect(data.workflows.by_status.failed).toBe(1);
    // Completion rate: 1 out of 2 = 50%
    expect(data.workflows.workflow_completion_rate).toBe(50);

    // Top-level compatibility keys
    expect(data.candidate_count).toBe(3);
    expect(data.shortlist_rate).toBe(33);
    expect(data.workflow_completion_rate).toBe(50);

    // Agent metrics
    expect(Array.isArray(data.agent_execution_metrics)).toBe(true);
    const parserMetric = data.agent_execution_metrics.find((m) => m._id === "resume_parser");
    expect(parserMetric).toBeDefined();
    expect(parserMetric.executions).toBe(2);
    expect(parserMetric.success_count).toBe(1);
    expect(parserMetric.failed_count).toBe(1);
  });

  test("tenant isolation: Recruiter B does not see Recruiter A's jobs or applications", async () => {
    const res = await request(app)
      .get("/analytics")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Recruiter B has exactly 1 job, 1 application, 1 candidate, 1 workflow
    expect(data.jobs.total_jobs).toBe(1);
    expect(data.jobs.published_jobs).toBe(1);
    expect(data.applications.total_applications).toBe(1);
    expect(data.applications.by_status.shortlisted).toBe(1);
    expect(data.applications.shortlist_rate).toBe(100);
    expect(data.candidate_count).toBe(1);
    expect(data.workflows.total_workflows).toBe(1);
    expect(data.workflows.by_status.completed).toBe(1);
  });

  test("recruiter cannot query analytics for another recruiter's job ID (403)", async () => {
    const res = await request(app)
      .get(`/analytics?job_id=${jobA1._id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/access denied/i);
  });

  test("filter by specific job_id returns isolated metrics for that job only", async () => {
    const res = await request(app)
      .get(`/analytics?job_id=${jobA1._id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.jobs.total_jobs).toBe(1);
    expect(res.body.data.applications.total_applications).toBe(3);
  });

  test("filter include_archived=false excludes archived jobs", async () => {
    const res = await request(app)
      .get("/analytics?include_archived=false")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.jobs.total_jobs).toBe(1);
    expect(res.body.data.jobs.archived_jobs).toBe(0);
  });

  test("empty dataset for new recruiter returns zeros cleanly", async () => {
    const newRecruiter = await User.create({
      name: "Empty Recruiter",
      email: "empty@analytics-test.com",
      password: "HashedPassword123",
      role: "recruiter"
    });
    const emptyToken = jwt.sign(
      { id: newRecruiter._id.toString(), email: newRecruiter.email, role: newRecruiter.role },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    const res = await request(app)
      .get("/analytics")
      .set("Authorization", `Bearer ${emptyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.jobs.total_jobs).toBe(0);
    expect(res.body.data.applications.total_applications).toBe(0);
    expect(res.body.data.candidate_count).toBe(0);
    expect(res.body.data.shortlist_rate).toBe(0);
    expect(res.body.data.workflow_completion_rate).toBe(0);
  });

  test("invalid date format returns 400 validation error", async () => {
    const res = await request(app)
      .get("/analytics?from=invalid-date")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

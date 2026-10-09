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
const { env } = require("../src/config/env");

describe("Phase 2 — Core ATS Functionality", () => {
  let app;
  const testDbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment-test";

  let recruiterA;
  let tokenA;
  let recruiterB;
  let tokenB;

  // Sample dummy PDF file for testing uploads
  const dummyPdfPath = path.join(__dirname, "test-resume.pdf");

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    app = createApp();

    // Create a dummy PDF file for upload tests if it does not exist
    fs.writeFileSync(dummyPdfPath, "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");

    // Clean test data
    await User.deleteMany({ email: /@ats-test\.com$/ });
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    await Application.deleteMany({});

    // Setup Recruiter A
    recruiterA = await User.create({
      name: "Recruiter A",
      email: "recruiterA@ats-test.com",
      password: "hashedPassword123",
      role: "recruiter"
    });
    tokenA = jwt.sign(
      { id: recruiterA._id.toString(), email: recruiterA.email, role: "recruiter" },
      env.jwtSecret,
      { expiresIn: "1h" }
    );

    // Setup Recruiter B
    recruiterB = await User.create({
      name: "Recruiter B",
      email: "recruiterB@ats-test.com",
      password: "hashedPassword123",
      role: "recruiter"
    });
    tokenB = jwt.sign(
      { id: recruiterB._id.toString(), email: recruiterB.email, role: "recruiter" },
      env.jwtSecret,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    if (fs.existsSync(dummyPdfPath)) {
      fs.unlinkSync(dummyPdfPath);
    }
    await User.deleteMany({ email: /@ats-test\.com$/ });
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    await Application.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    await Application.deleteMany({});
  });

  // ==========================================
  // 1. RECRUITER JOB MANAGEMENT TESTS
  // ==========================================
  describe("Job Management & Authorization", () => {
    test("authenticated recruiter can create job with valid data", async () => {
      const res = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Fullstack Engineer",
          description: "Develop full-stack web applications with Node.js and React.",
          required_skills: ["Node.js", "React"],
          preferred_skills: ["MongoDB"],
          min_experience: 3,
          status: "published"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.title).toBe("Fullstack Engineer");
      expect(res.body.data.created_by).toBe(recruiterA._id.toString());
      expect(res.body.data.status).toBe("published");
      expect(res.body.data.is_published).toBe(true);
    });

    test("creating job with invalid data returns 400 with validation details", async () => {
      const res = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "A", // too short (< 2)
          description: "Short", // too short (< 10)
          min_experience: -1 // invalid (< 0)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Validation failed");
      expect(res.body.error.details.title).toBeDefined();
      expect(res.body.error.details.description).toBeDefined();
      expect(res.body.error.details.min_experience).toBeDefined();
    });

    test("unauthenticated user cannot create a job", async () => {
      const res = await request(app)
        .post("/jobs")
        .send({
          title: "Backend Engineer",
          description: "Build robust backend microservices in Node.js."
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("recruiter can retrieve own jobs", async () => {
      // Create job for recruiter A
      await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Recruiter A Job",
          description: "Job created specifically by Recruiter A."
        });

      // Create job for recruiter B
      await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          title: "Recruiter B Job",
          description: "Job created specifically by Recruiter B."
        });

      // Recruiter A lists jobs
      const res = await request(app)
        .get("/jobs")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe("Recruiter A Job");
    });

    test("recruiter can update own job", async () => {
      const createRes = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Initial Job Title",
          description: "Initial job description that meets character requirements."
        });

      const jobId = createRes.body.data._id;

      const updateRes = await request(app)
        .put(`/jobs/${jobId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Updated Job Title",
          description: "Updated job description that meets character requirements.",
          min_experience: 5
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.title).toBe("Updated Job Title");
      expect(updateRes.body.data.min_experience).toBe(5);
    });

    test("recruiter cannot update another recruiter's job", async () => {
      // Recruiter A creates a job
      const createRes = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Job Owned by A",
          description: "Description of job owned by Recruiter A."
        });

      const jobId = createRes.body.data._id;

      // Recruiter B attempts to update A's job
      const updateRes = await request(app)
        .put(`/jobs/${jobId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          title: "Malicious Edit by B",
          description: "Attempted description change by unauthorized recruiter."
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.success).toBe(false);
      expect(updateRes.body.error.message).toMatch(/permission|forbidden/i);
    });

    test("recruiter can publish and unpublish a job", async () => {
      const createRes = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Draft Job",
          description: "Draft job description that meets requirements.",
          status: "draft"
        });

      const jobId = createRes.body.data._id;
      expect(createRes.body.data.status).toBe("draft");
      expect(createRes.body.data.is_published).toBe(false);

      // Publish the job
      const publishRes = await request(app)
        .put(`/jobs/${jobId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          status: "published"
        });

      expect(publishRes.status).toBe(200);
      expect(publishRes.body.data.status).toBe("published");
      expect(publishRes.body.data.is_published).toBe(true);
    });
  });

  // ==========================================
  // 2. PUBLIC JOB DISCOVERY TESTS
  // ==========================================
  describe("Public Job Discovery", () => {
    let publishedJobId;
    let draftJobId;

    beforeEach(async () => {
      const pubRes = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Publicly Visible Job",
          description: "This job is published and should be seen by anyone.",
          status: "published"
        });
      publishedJobId = pubRes.body.data._id;

      const draftRes = await request(app)
        .post("/jobs")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          title: "Draft Unpublished Job",
          description: "This job is a draft and should NOT be publicly visible.",
          status: "draft"
        });
      draftJobId = draftRes.body.data._id;
    });

    test("public /jobs returns only published jobs and hides drafts", async () => {
      const res = await request(app).get("/jobs");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0]._id).toBe(publishedJobId);
      expect(res.body.data[0].title).toBe("Publicly Visible Job");
    });

    test("public user can view published job details", async () => {
      const res = await request(app).get(`/jobs/${publishedJobId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe("Publicly Visible Job");
    });

    test("public user cannot view draft job details (returns 404)", async () => {
      const res = await request(app).get(`/jobs/${draftJobId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 3. CANDIDATE APPLICATION FLOW TESTS
  // ==========================================
  describe("Candidate Application Flow", () => {
    let openJob;
    let draftJob;

    beforeEach(async () => {
      const pub = await Job.create({
        title: "Frontend React Developer",
        description: "Develop responsive UIs using modern React and Tailwind CSS.",
        required_skills: ["React", "JavaScript"],
        created_by: recruiterA._id,
        status: "published",
        is_published: true
      });
      openJob = pub;

      const dft = await Job.create({
        title: "Draft Position",
        description: "Draft position not yet accepting candidate submissions.",
        required_skills: ["Go"],
        created_by: recruiterA._id,
        status: "draft",
        is_published: false
      });
      draftJob = dft;
    });

    test("valid application submission succeeds and persists Candidate and Application", async () => {
      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Jane Doe")
        .field("email", "jane.doe@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.candidate).toBeDefined();
      expect(res.body.data.application).toBeDefined();
      expect(res.body.data.candidate.email).toBe("jane.doe@example.com");
      expect(res.body.data.candidate.name).toBe("Jane Doe");
      expect(res.body.data.application.job_id).toBe(openJob._id.toString());

      // Verify database records
      const savedCandidate = await Candidate.findOne({ email: "jane.doe@example.com" });
      expect(savedCandidate).not.toBeNull();
      expect(savedCandidate.phone).toBe("+1234567890");

      const savedApp = await Application.findOne({
        job_id: openJob._id,
        candidate_id: savedCandidate._id
      });
      expect(savedApp).not.toBeNull();
      expect(savedApp.recruiter_id.toString()).toBe(recruiterA._id.toString());
    });

    test("invalid application inputs fail with 400", async () => {
      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "J") // too short
        .field("email", "invalid-email") // invalid
        .field("phone", "123") // too short
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Validation failed");
    });

    test("missing resume file fails with 400", async () => {
      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Jane Doe")
        .field("email", "jane.noresume@example.com")
        .field("phone", "+1234567890");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/resume.*required/i);
    });

    test("applying to non-existent job ID fails with 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", nonExistentId)
        .field("name", "Jane Doe")
        .field("email", "jane.notfound@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    test("applying to unpublished/draft job fails with 400", async () => {
      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", draftJob._id.toString())
        .field("name", "Jane Doe")
        .field("email", "jane.draft@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not open|not accepting/i);
    });

    test("duplicate application to the same job is rejected with 409", async () => {
      // First submission
      const firstRes = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Bob Smith")
        .field("email", "bob.smith@example.com")
        .field("phone", "+1987654321")
        .attach("resume", dummyPdfPath);

      expect(firstRes.status).toBe(201);

      // Duplicate submission
      const duplicateRes = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Bob Smith")
        .field("email", "bob.smith@example.com")
        .field("phone", "+1987654321")
        .attach("resume", dummyPdfPath);

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.error.message).toMatch(/already applied/i);
    });
  });

  // ==========================================
  // 4. RECRUITER CANDIDATE / APPLICATION VIEW TESTS
  // ==========================================
  describe("Recruiter Candidate Inspection & Multi-Tenant Isolation", () => {
    let jobA;
    let jobB;
    let candidateA;
    let candidateB;

    beforeEach(async () => {
      jobA = await Job.create({
        title: "Recruiter A Job",
        description: "Position created by recruiter A with adequate description length.",
        created_by: recruiterA._id,
        status: "published"
      });

      jobB = await Job.create({
        title: "Recruiter B Job",
        description: "Position created by recruiter B with adequate description length.",
        created_by: recruiterB._id,
        status: "published"
      });

      // Apply to Job A
      const appARes = await request(app)
        .post("/candidates/upload")
        .field("job_id", jobA._id.toString())
        .field("name", "Candidate for A")
        .field("email", "candA@example.com")
        .field("phone", "+1112223334")
        .attach("resume", dummyPdfPath);
      candidateA = appARes.body.data.candidate;

      // Apply to Job B
      const appBRes = await request(app)
        .post("/candidates/upload")
        .field("job_id", jobB._id.toString())
        .field("name", "Candidate for B")
        .field("email", "candB@example.com")
        .field("phone", "+9998887776")
        .attach("resume", dummyPdfPath);
      candidateB = appBRes.body.data.candidate;
    });

    test("recruiter sees only candidates for their own jobs", async () => {
      const res = await request(app)
        .get("/candidates")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].email).toBe("canda@example.com");
    });

    test("recruiter can view applications for their job via /jobs/:id/applications", async () => {
      const res = await request(app)
        .get(`/jobs/${jobA._id}/applications`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].candidate_id.email).toBe("canda@example.com");
    });

    test("recruiter cannot view applications for another recruiter's job", async () => {
      const res = await request(app)
        .get(`/jobs/${jobB._id}/applications`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("recruiter cannot query candidate from another recruiter's job", async () => {
      const res = await request(app)
        .get(`/candidates/${candidateB._id}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    test("unauthenticated user cannot access candidate listing", async () => {
      const res = await request(app).get("/candidates");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

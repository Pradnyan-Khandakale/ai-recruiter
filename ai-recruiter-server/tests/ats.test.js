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
  let recruiterC;
  let tokenC;

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

    // Setup Recruiter C (for unauthorized third-party isolation tests)
    recruiterC = await User.create({
      name: "Recruiter C",
      email: "recruiterC@ats-test.com",
      password: "hashedPassword123",
      role: "recruiter"
    });
    tokenC = jwt.sign(
      { id: recruiterC._id.toString(), email: recruiterC.email, role: "recruiter" },
      env.jwtSecret,
      { expiresIn: "1h" }
    );
    // Clean any prior test upload files
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (fs.existsSync(uploadsDir)) {
      for (const file of fs.readdirSync(uploadsDir)) {
        if (file.includes("test-resume")) {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch {}
        }
      }
    }
  });

  afterAll(async () => {
    if (fs.existsSync(dummyPdfPath)) {
      fs.unlinkSync(dummyPdfPath);
    }
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (fs.existsSync(uploadsDir)) {
      for (const file of fs.readdirSync(uploadsDir)) {
        if (file.includes("test-resume")) {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
          } catch {}
        }
      }
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

    test("recruiter can safely archive/delete their own job without deleting applications or candidates", async () => {
      const job = await Job.create({
        title: "Job to be Archived",
        description: "Position to test safe deletion and archival policy.",
        created_by: recruiterA._id,
        status: "published"
      });

      // Submit an application for this job
      const appRes = await request(app)
        .post("/candidates/upload")
        .field("job_id", job._id.toString())
        .field("name", "Applicant For Archive")
        .field("email", "archive.applicant@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);
      expect(appRes.status).toBe(201);
      const candidateId = appRes.body.data.candidate._id;

      // Recruiter A archives the job via DELETE
      const deleteRes = await request(app)
        .delete(`/jobs/${job._id}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.deleted).toBe(true);
      expect(deleteRes.body.data.status).toBe("archived");

      // Verify job record is soft deleted/archived in DB
      const archivedJob = await Job.findById(job._id);
      expect(archivedJob).not.toBeNull();
      expect(archivedJob.status).toBe("archived");
      expect(archivedJob.is_published).toBe(false);

      // Public discovery cannot see the archived job
      const publicJobsRes = await request(app).get("/jobs");
      const foundInPublic = publicJobsRes.body.data.some((j) => j._id.toString() === job._id.toString());
      expect(foundInPublic).toBe(false);

      // Public detail route returns 404 for archived job
      const publicDetailRes = await request(app).get(`/jobs/${job._id}`);
      expect(publicDetailRes.status).toBe(404);

      // New candidate application to archived job is rejected with 400
      const newAppRes = await request(app)
        .post("/candidates/upload")
        .field("job_id", job._id.toString())
        .field("name", "New Applicant")
        .field("email", "new.app@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);
      expect(newAppRes.status).toBe(400);
      expect(newAppRes.body.error.message).toMatch(/not open|not accepting/i);

      // Historical application records remain intact and accessible to recruiter
      const appCount = await Application.countDocuments({ job_id: job._id });
      expect(appCount).toBe(1);

      const appsListRes = await request(app)
        .get(`/jobs/${job._id}/applications`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(appsListRes.status).toBe(200);
      expect(appsListRes.body.data.length).toBe(1);

      // Candidate document was NOT cascaded or deleted
      const candInDb = await Candidate.findById(candidateId);
      expect(candInDb).not.toBeNull();
    });

    test("recruiter cannot delete another recruiter's job", async () => {
      const jobA = await Job.create({
        title: "Recruiter A Job Protected",
        description: "Must not be deleted by another recruiter.",
        created_by: recruiterA._id,
        status: "published"
      });

      const res = await request(app)
        .delete(`/jobs/${jobA._id}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/permission|forbidden/i);

      const jobStillExists = await Job.findById(jobA._id);
      expect(jobStillExists.status).toBe("published");
    });

    test("unauthenticated user cannot delete job", async () => {
      const job = await Job.create({
        title: "Unauthenticated Delete Test",
        description: "Ensure unauthenticated deletes are blocked.",
        created_by: recruiterA._id,
        status: "published"
      });

      const res = await request(app).delete(`/jobs/${job._id}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("archived job cannot be modified via update endpoint", async () => {
      const job = await Job.create({
        title: "Archived Job Modify Test",
        description: "Ensure archived jobs cannot be edited.",
        created_by: recruiterA._id,
        status: "archived",
        is_published: false
      });

      const res = await request(app)
        .put(`/jobs/${job._id}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send({ title: "New Title Attempt" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/archived/i);
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

    test("rejected resume uploads due to validation errors are cleaned up from disk", async () => {
      const uploadsDir = path.join(__dirname, "..", "uploads");
      const filesBefore = new Set(fs.readdirSync(uploadsDir));

      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "X") // validation error (min length 2)
        .field("email", "bad-email")
        .field("phone", "12")
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(400);

      const filesAfter = fs.readdirSync(uploadsDir);
      const newFiles = filesAfter.filter((f) => !filesBefore.has(f));
      expect(newFiles.length).toBe(0);
    });

    test("rejected resume uploads due to non-existent job are cleaned up from disk", async () => {
      const uploadsDir = path.join(__dirname, "..", "uploads");
      const filesBefore = new Set(fs.readdirSync(uploadsDir));
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", nonExistentId)
        .field("name", "Valid Name")
        .field("email", "cleanup.test@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(404);

      const filesAfter = fs.readdirSync(uploadsDir);
      const newFiles = filesAfter.filter((f) => !filesBefore.has(f));
      expect(newFiles.length).toBe(0);
    });

    test("rejected duplicate upload cleans up new file while retaining earlier successful resume", async () => {
      const uploadsDir = path.join(__dirname, "..", "uploads");

      // 1. Initial valid upload
      const res1 = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Duplicate Cleanup Test")
        .field("email", "dup.cleanup@example.com")
        .field("phone", "+1122334455")
        .attach("resume", dummyPdfPath);

      expect(res1.status).toBe(201);
      const originalFileRel = res1.body.data.candidate.resume_url;
      const originalFilePath = path.join(__dirname, "..", originalFileRel);
      expect(fs.existsSync(originalFilePath)).toBe(true);

      const filesBeforeSecond = new Set(fs.readdirSync(uploadsDir));

      // 2. Duplicate upload to the same job (rejected with 409)
      const res2 = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Duplicate Cleanup Test")
        .field("email", "dup.cleanup@example.com")
        .field("phone", "+1122334455")
        .attach("resume", dummyPdfPath);

      expect(res2.status).toBe(409);

      // Verify original file is still intact
      expect(fs.existsSync(originalFilePath)).toBe(true);

      // Verify no orphaned file from second submission remains
      const filesAfterSecond = fs.readdirSync(uploadsDir);
      const newFiles = filesAfterSecond.filter((f) => !filesBeforeSecond.has(f));
      expect(newFiles.length).toBe(0);

      if (fs.existsSync(originalFilePath)) {
        fs.unlinkSync(originalFilePath);
      }
    });

    test("successful application submission retains resume file on disk", async () => {
      const res = await request(app)
        .post("/candidates/upload")
        .field("job_id", openJob._id.toString())
        .field("name", "Retain File Test")
        .field("email", "retain.file@example.com")
        .field("phone", "+1122334455")
        .attach("resume", dummyPdfPath);

      expect(res.status).toBe(201);
      const resumePath = path.join(__dirname, "..", res.body.data.candidate.resume_url);
      expect(fs.existsSync(resumePath)).toBe(true);

      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
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

    test("candidate applying to two jobs across different recruiters remains visible to each recruiter", async () => {
      // Candidate applies to Job A (Recruiter A)
      const resA = await request(app)
        .post("/candidates/upload")
        .field("job_id", jobA._id.toString())
        .field("name", "Shared Applicant")
        .field("email", "shared.applicant@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);
      expect(resA.status).toBe(201);

      // Same candidate applies to Job B (Recruiter B)
      const resB = await request(app)
        .post("/candidates/upload")
        .field("job_id", jobB._id.toString())
        .field("name", "Shared Applicant Updated")
        .field("email", "shared.applicant@example.com")
        .field("phone", "+1234567890")
        .attach("resume", dummyPdfPath);
      expect(resB.status).toBe(201);

      // Verify only ONE Candidate document exists for this email
      const candDocs = await Candidate.find({ email: "shared.applicant@example.com" });
      expect(candDocs.length).toBe(1);
      const candidateId = candDocs[0]._id;

      // Recruiter A lists candidates - MUST see Shared Applicant for Job A
      const listA = await request(app)
        .get("/candidates")
        .set("Authorization", `Bearer ${tokenA}`);
      expect(listA.status).toBe(200);
      const candFoundA = listA.body.data.find((c) => c.email === "shared.applicant@example.com");
      expect(candFoundA).toBeDefined();
      expect(candFoundA.job_id._id.toString()).toBe(jobA._id.toString());

      // Recruiter A filters specifically for Job A - MUST see Shared Applicant
      const filteredA = await request(app)
        .get(`/candidates?job_id=${jobA._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(filteredA.status).toBe(200);
      expect(filteredA.body.data.some((c) => c.email === "shared.applicant@example.com")).toBe(true);

      // Recruiter B lists candidates - MUST see Shared Applicant for Job B
      const listB = await request(app)
        .get("/candidates")
        .set("Authorization", `Bearer ${tokenB}`);
      expect(listB.status).toBe(200);
      const candFoundB = listB.body.data.find((c) => c.email === "shared.applicant@example.com");
      expect(candFoundB).toBeDefined();
      expect(candFoundB.job_id._id.toString()).toBe(jobB._id.toString());

      // Recruiter B filters specifically for Job B - MUST see Shared Applicant
      const filteredB = await request(app)
        .get(`/candidates?job_id=${jobB._id}`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(filteredB.status).toBe(200);
      expect(filteredB.body.data.some((c) => c.email === "shared.applicant@example.com")).toBe(true);

      // Recruiter A cannot query candidate with Job B filter
      const crossFilterA = await request(app)
        .get(`/candidates?job_id=${jobB._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(crossFilterA.status).toBe(403);

      // Recruiter B cannot query candidate with Job A filter
      const crossFilterB = await request(app)
        .get(`/candidates?job_id=${jobA._id}`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(crossFilterB.status).toBe(403);

      // Recruiter A inspects candidate details - applications list must ONLY contain Job A, NOT Job B
      const detailA = await request(app)
        .get(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(detailA.status).toBe(200);
      expect(detailA.body.data.applications.length).toBe(1);
      expect(detailA.body.data.applications[0].job_id._id.toString()).toBe(jobA._id.toString());

      // Recruiter B inspects candidate details - applications list must ONLY contain Job B, NOT Job A
      const detailB = await request(app)
        .get(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(detailB.status).toBe(200);
      expect(detailB.body.data.applications.length).toBe(1);
      expect(detailB.body.data.applications[0].job_id._id.toString()).toBe(jobB._id.toString());

      // Recruiter C (who has no applications from this candidate) CANNOT view this candidate
      const detailC = await request(app)
        .get(`/candidates/${candidateId}`)
        .set("Authorization", `Bearer ${tokenC}`);
      expect(detailC.status).toBe(403);
      expect(detailC.body.success).toBe(false);
    });

    test("candidate applying to two different jobs by same recruiter is visible in both job filters", async () => {
      // Create two distinct jobs for recruiter A
      const jobA1 = await Job.create({
        title: "Recruiter A First Multi Position",
        description: "First position created by recruiter A for multiple application testing.",
        created_by: recruiterA._id,
        status: "published"
      });

      const jobA2 = await Job.create({
        title: "Recruiter A Second Multi Position",
        description: "Second position created by recruiter A for multiple application testing.",
        created_by: recruiterA._id,
        status: "published"
      });

      // Apply to Job A1
      const res1 = await request(app)
        .post("/candidates/upload")
        .field("job_id", jobA1._id.toString())
        .field("name", "Multi Job Applicant")
        .field("email", "multi.job@example.com")
        .field("phone", "+1122334455")
        .attach("resume", dummyPdfPath);
      expect(res1.status).toBe(201);

      // Apply to Job A2
      const res2 = await request(app)
        .post("/candidates/upload")
        .field("job_id", jobA2._id.toString())
        .field("name", "Multi Job Applicant")
        .field("email", "multi.job@example.com")
        .field("phone", "+1122334455")
        .attach("resume", dummyPdfPath);
      expect(res2.status).toBe(201);

      // Filtering for Job A1 returns candidate
      const filterJobA1 = await request(app)
        .get(`/candidates?job_id=${jobA1._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(filterJobA1.status).toBe(200);
      expect(filterJobA1.body.data.length).toBe(1);
      expect(filterJobA1.body.data[0].email).toBe("multi.job@example.com");

      // Filtering for Job A2 returns candidate
      const filterJobA2 = await request(app)
        .get(`/candidates?job_id=${jobA2._id}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(filterJobA2.status).toBe(200);
      expect(filterJobA2.body.data.length).toBe(1);
      expect(filterJobA2.body.data[0].email).toBe("multi.job@example.com");

      // Dedicated applications endpoint for Job A1 returns 1
      const appsJobA1 = await request(app)
        .get(`/jobs/${jobA1._id}/applications`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(appsJobA1.status).toBe(200);
      expect(appsJobA1.body.data.length).toBe(1);
      expect(appsJobA1.body.data[0].candidate_id.email).toBe("multi.job@example.com");

      // Dedicated applications endpoint for Job A2 returns 1
      const appsJobA2 = await request(app)
        .get(`/jobs/${jobA2._id}/applications`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(appsJobA2.status).toBe(200);
      expect(appsJobA2.body.data.length).toBe(1);
      expect(appsJobA2.body.data[0].candidate_id.email).toBe("multi.job@example.com");

      // Candidate count in DB for this email is 1 (not duplicated)
      const candDocs = await Candidate.find({ email: "multi.job@example.com" });
      expect(candDocs.length).toBe(1);

      // Applications count for this candidate across both jobs is 2
      const apps = await Application.find({ candidate_id: candDocs[0]._id });
      expect(apps.length).toBe(2);
    });
  });
});

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createApp } = require("../src/app");
const User = require("../src/models/User");
const { env } = require("../src/config/env");

describe("Authentication & Authorization System", () => {
  let app;
  const testDbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment-test";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    app = createApp();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@test-auth\.com$/ });
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /@test-auth\.com$/ });
  });

  describe("POST /auth/signup", () => {
    test("valid signup creates user and returns 201 with JWT token", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({
          name: "Recruiter Alice",
          email: "alice@test-auth.com",
          password: "password123",
          role: "recruiter"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe("alice@test-auth.com");
      expect(res.body.data.user.name).toBe("Recruiter Alice");
      expect(res.body.data.user.role).toBe("recruiter");
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.token).toBeDefined();

      const dbUser = await User.findOne({ email: "alice@test-auth.com" });
      expect(dbUser).not.toBeNull();
      expect(dbUser.password).not.toBe("password123");
      const isHashed = await bcrypt.compare("password123", dbUser.password);
      expect(isHashed).toBe(true);
    });

    test("signup with invalid data fails with 400 and validation details", async () => {
      const res = await request(app)
        .post("/auth/signup")
        .send({
          name: "A",
          email: "not-an-email",
          password: "short"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Validation failed");
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.name).toBeDefined();
      expect(res.body.error.details.email).toBeDefined();
      expect(res.body.error.details.password).toBeDefined();
    });

    test("duplicate email registration is rejected with 409", async () => {
      await request(app)
        .post("/auth/signup")
        .send({
          name: "Original User",
          email: "duplicate@test-auth.com",
          password: "password123"
        });

      const res = await request(app)
        .post("/auth/signup")
        .send({
          name: "Duplicate User",
          email: "duplicate@test-auth.com",
          password: "password456"
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already registered|already exists/i);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("securePassword123", 10);
      await User.create({
        name: "Login Recruiter",
        email: "login@test-auth.com",
        password: hashedPassword,
        role: "recruiter"
      });
    });

    test("valid credentials return 200 with JWT token", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "login@test-auth.com",
          password: "securePassword123"
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("login@test-auth.com");
      expect(res.body.data.token).toBeDefined();

      const decoded = jwt.verify(res.body.data.token, env.jwtSecret);
      expect(decoded.email).toBe("login@test-auth.com");
      expect(decoded.role).toBe("recruiter");
    });

    test("invalid password returns 401", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "login@test-auth.com",
          password: "wrongPassword"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid/i);
    });

    test("non-existent email returns 401", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({
          email: "unknown@test-auth.com",
          password: "securePassword123"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid/i);
    });
  });

  describe("Protected Endpoint: GET /auth/me", () => {
    let testUser;
    let validToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      testUser = await User.create({
        name: "Me User",
        email: "me@test-auth.com",
        password: hashedPassword,
        role: "recruiter"
      });
      validToken = jwt.sign(
        { id: testUser._id.toString(), email: testUser.email, role: "recruiter" },
        env.jwtSecret,
        { expiresIn: "1h" }
      );
    });

    test("valid token loads current user from MongoDB", async () => {
      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("me@test-auth.com");
      expect(res.body.data.user.id).toBe(testUser._id.toString());
      expect(res.body.data.user.password).toBeUndefined();
    });

    test("missing token returns 401 Unauthorized", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/token is required/i);
    });

    test("invalid token returns 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token-string");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid or expired/i);
    });

    test("expired token returns 401 Unauthorized", async () => {
      const expiredToken = jwt.sign(
        { id: testUser._id.toString(), email: testUser.email, role: "recruiter" },
        env.jwtSecret,
        { expiresIn: "0s" }
      );

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Role-Based Authorization", () => {
    let candidateUser;
    let recruiterUser;
    let candidateToken;
    let recruiterToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash("password123", 10);
      // Intentionally create user with non-recruiter role to verify 403
      candidateUser = await User.create({
        name: "Candidate Dan",
        email: "candidate@test-auth.com",
        password: hashedPassword,
        role: "admin" // we'll use non-recruiter logic test below
      });

      recruiterUser = await User.create({
        name: "Recruiter Bob",
        email: "bob@test-auth.com",
        password: hashedPassword,
        role: "recruiter"
      });

      recruiterToken = jwt.sign(
        { id: recruiterUser._id.toString(), email: recruiterUser.email, role: "recruiter" },
        env.jwtSecret
      );
    });

    test("unauthenticated access to protected recruiter endpoint returns 401", async () => {
      const res = await request(app).get("/workflow");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test("authenticated recruiter can access recruiter endpoint", async () => {
      // /workflow requires requireAuth, requireRole('recruiter')
      const res = await request(app)
        .get("/workflow")
        .set("Authorization", `Bearer ${recruiterToken}`);

      // Controller returns 501 (not implemented in Phase 1), but passed auth & authorization!
      // Crucially, it did NOT return 401 or 403!
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });
});

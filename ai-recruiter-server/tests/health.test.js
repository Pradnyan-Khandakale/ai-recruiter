const request = require("supertest");
const mongoose = require("mongoose");
const { createApp } = require("../src/app");

describe("Phase 4D — Health & Dependency Readiness Endpoints", () => {
  let app;
  const testDbUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment-test";

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }
    app = createApp();
  });

  afterAll(async () => {
    delete process.env.REQUIRE_PERSISTENT_STORAGE;
    delete process.env.REQUIRE_SEMANTIC_EMBEDDINGS;
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  test("GET /health returns process liveness status 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.data.service).toBe("ai-recruitment-api");
  });

  test("GET /health/ready returns 200 with dependency audit when connected in fallback/dev mode", async () => {
    delete process.env.REQUIRE_PERSISTENT_STORAGE;
    delete process.env.REQUIRE_SEMANTIC_EMBEDDINGS;

    const res = await request(app).get("/health/ready");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ready");
    expect(res.body.data.dependencies).toBeDefined();
    expect(res.body.data.dependencies.database.status).toBe("connected");
    expect(["qdrant", "in-memory-fallback"]).toContain(res.body.data.dependencies.vector_store.provider);
    expect(["huggingface", "hash-deterministic-fallback"]).toContain(res.body.data.dependencies.embeddings.provider);
  });

  test("GET /health/ready returns 503 when strict persistent storage is required but Qdrant is offline", async () => {
    process.env.REQUIRE_PERSISTENT_STORAGE = "true";

    try {
      const res = await request(app).get("/health/ready");
      // Since Qdrant port 6333 is offline in this environment:
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe("not_ready");
      expect(res.body.data.dependencies.vector_store.is_persistent).toBe(false);
    } finally {
      delete process.env.REQUIRE_PERSISTENT_STORAGE;
    }
  });

  test("GET /health/ready returns 503 when database is disconnected", async () => {
    await mongoose.connection.close();

    try {
      const res = await request(app).get("/health/ready");
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.data.dependencies.database.status).toBe("disconnected");
    } finally {
      await mongoose.connect(testDbUri);
    }
  });
});

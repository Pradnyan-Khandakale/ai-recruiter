const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const path = require("path");
const routes = require("./routes");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/error.middleware");

function createApp() {
  const app = express();
  const allowedOrigins = new Set([
    ...env.clientUrls,
    ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:3000", "http://localhost:3001"])
  ]);

  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  }));
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 120 }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

  app.get("/health", (req, res) => {
    res.json({ success: true, data: { status: "ok", service: "ai-recruitment-api" } });
  });

  app.get("/health/ready", async (req, res) => {
    const mongoose = require("mongoose");
    const isDbConnected = mongoose.connection.readyState === 1;

    let isQdrantReady = false;
    try {
      const { ensureCollection } = require("./rag/rag.service");
      isQdrantReady = await ensureCollection();
    } catch {
      isQdrantReady = false;
    }

    const hasHfKey = Boolean(process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY);
    const hasResendKey = Boolean(env.resendApiKey);

    const requirePersistent = process.env.REQUIRE_PERSISTENT_STORAGE === "true";
    const requireSemantic = process.env.REQUIRE_SEMANTIC_EMBEDDINGS === "true";

    const isReady =
      isDbConnected &&
      (!requirePersistent || isQdrantReady) &&
      (!requireSemantic || hasHfKey);

    const statusCode = isReady ? 200 : 503;
    res.status(statusCode).json({
      success: isReady,
      data: {
        status: isReady ? "ready" : "not_ready",
        service: "ai-recruitment-api",
        dependencies: {
          database: {
            status: isDbConnected ? "connected" : "disconnected"
          },
          vector_store: {
            provider: isQdrantReady ? "qdrant" : "in-memory-fallback",
            is_persistent: isQdrantReady
          },
          embeddings: {
            provider: hasHfKey ? "huggingface" : "hash-deterministic-fallback",
            is_semantic: hasHfKey
          },
          email: {
            provider: hasResendKey ? "resend" : "fallback",
            is_live: hasResendKey
          }
        }
      }
    });
  });

  app.use(routes);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

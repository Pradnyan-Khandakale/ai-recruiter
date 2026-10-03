const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const clientUrls = String(process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/ai-recruitment",
  jwtSecret: process.env.JWT_SECRET || "development-only-change-me",
  clientUrl: clientUrls[0] || "http://localhost:3000",
  clientUrls,
  qdrantUrl: process.env.QDRANT_URL || "http://localhost:6333",
  qdrantApiKey: process.env.QDRANT_API_KEY || "",
  qdrantCollection: process.env.QDRANT_COLLECTION || "recruitment_vectors",
  groqApiKey: process.env.GROQ_API_KEY || "",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY || ""
};

module.exports = { env };

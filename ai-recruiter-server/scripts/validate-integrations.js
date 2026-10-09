const path = require("path");
const dotenv = require("dotenv");

// Load .env
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const { env } = require("../src/config/env");
const { validateGeminiConnection, generateStructuredJson } = require("../src/services/gemini.service");
const { validateQdrantConnection } = require("../src/rag/rag.service");
const { z } = require("zod");

async function main() {
  console.log("================================================================");
  console.log("          AI RECRUITER - LIVE INTEGRATION VALIDATION            ");
  console.log("================================================================\n");

  let allPassed = true;

  // 1. GOOGLE GEMINI VALIDATION
  console.log("----------------------------------------------------------------");
  console.log("1. Google Gemini LLM Provider");
  console.log("----------------------------------------------------------------");

  if (!env.geminiApiKey) {
    console.log("[-] STATUS: SKIPPED");
    console.log("    Reason: GEMINI_API_KEY is not configured in environment.");
  } else {
    const configuredModel = env.geminiModel || "gemini-2.5-flash";
    console.log(`[*] Target Model: ${configuredModel}`);
    console.log(`[*] API Key Configured: Yes (Masked)`);

    const geminiStatus = await validateGeminiConnection({ model: configuredModel });

    if (geminiStatus.ok) {
      console.log(`[+] AUTH & CONNECTIVITY: PASS`);
      console.log(`    Latency: ${geminiStatus.latencyMs}ms`);
      console.log(`    Response Sample: "${geminiStatus.responseSample}"`);

      // Test Structured JSON Output with Zod
      console.log(`[*] Testing Structured JSON Generation...`);
      const testSchema = z.object({
        role: z.string(),
        skills: z.array(z.string()).min(1),
        ready: z.boolean()
      });

      const structuredRes = await generateStructuredJson({
        prompt: "Generate a JSON object matching this schema exactly with keys 'role' (string), 'skills' (array of strings), and 'ready' (boolean): Role is 'Senior React Engineer', skills are ['React', 'Next.js'], ready is true.",
        systemInstruction: "You are a JSON generator. You must output a JSON object with keys: role (string), skills (string array), ready (boolean).",
        schema: testSchema,
        model: configuredModel
      });

      if (structuredRes.success && structuredRes.data) {
        console.log(`[+] STRUCTURED OUTPUT: PASS (Zod Validated)`);
        console.log(`    Parsed Data:`, JSON.stringify(structuredRes.data));
      } else {
        console.log(`[-] STRUCTURED OUTPUT: FAIL - ${structuredRes.error}`);
        allPassed = false;
      }
    } else {
      console.log(`[-] STATUS: ${geminiStatus.status}`);
      console.log(`    Error Code: ${geminiStatus.code}`);
      console.log(`    Details: ${geminiStatus.message}`);
      allPassed = false;
    }
  }

  console.log("\n----------------------------------------------------------------");
  console.log("2. Qdrant Vector Database");
  console.log("----------------------------------------------------------------");

  if (!env.qdrantUrl) {
    console.log("[-] STATUS: SKIPPED");
    console.log("    Reason: QDRANT_URL is not configured.");
  } else {
    const isCloud = env.qdrantUrl.includes(".qdrant.io") || env.qdrantUrl.includes("cloud.qdrant");
    console.log(`[*] Target Endpoint: ${isCloud ? "Qdrant Cloud (HTTPS)" : env.qdrantUrl}`);
    console.log(`[*] Target Collection: ${env.qdrantCollection}`);
    console.log(`[*] API Key Configured: ${env.qdrantApiKey ? "Yes (Masked)" : "No"}`);

    const qdrantStatus = await validateQdrantConnection();

    if (qdrantStatus.ok) {
      console.log(`[+] AUTH & CONNECTIVITY: PASS`);
      console.log(`    Latency: ${qdrantStatus.latencyMs}ms`);
      console.log(`    Collection Status: Active (Green)`);
      console.log(`    Vector Dimensions: ${qdrantStatus.vectorDimensions} (Expected: 384)`);
      console.log(`    Distance Metric: ${qdrantStatus.distanceMetric} (Expected: Cosine)`);
      console.log(`    Total Points: ${qdrantStatus.pointsCount}`);
    } else {
      console.log(`[-] STATUS: ${qdrantStatus.status}`);
      console.log(`    Error Code: ${qdrantStatus.code}`);
      console.log(`    Details: ${qdrantStatus.message}`);
      allPassed = false;
    }
  }

  console.log("\n----------------------------------------------------------------");
  console.log("3. Embeddings & Email Services");
  console.log("----------------------------------------------------------------");
  const hasHfKey = Boolean(process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY);
  const hasResendKey = Boolean(env.resendApiKey);

  console.log(`[*] Embeddings Provider: ${hasHfKey ? "Hugging Face (BAAI/bge-small-en-v1.5)" : "Deterministic Lexical Hash Fallback (384-dim)"}`);
  console.log(`[*] Email Provider: ${hasResendKey ? "Resend (Live)" : "Simulated Local Delivery (Fallback)"}`);

  console.log("\n================================================================");
  if (allPassed) {
    console.log("               INTEGRATION VALIDATION: ALL PASS                 ");
  } else {
    console.log("               INTEGRATION VALIDATION: WARNINGS / FAILURES      ");
  }
  console.log("================================================================\n");

  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Integration validation runner failed:", err.message);
  process.exit(1);
});

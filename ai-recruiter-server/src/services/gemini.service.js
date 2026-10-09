const { GoogleGenAI } = require("@google/genai");
const { env } = require("../config/env");

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

/**
 * Sanitizes any string or error message so raw API keys, bearer tokens, or query keys are never leaked.
 */
function sanitizeError(error) {
  if (!error) return "Unknown error";
  let message = typeof error === "string" ? error : (error.message || String(error));
  if (env.geminiApiKey) {
    message = message.split(env.geminiApiKey).join("[REDACTED_API_KEY]");
  }
  // Also redact typical Google API key formats in URLs or headers
  message = message.replace(/key=AIza[0-9A-Za-z-_]{35}/g, "key=[REDACTED]");
  message = message.replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED_API_KEY]");
  return message;
}

/**
 * Creates or retrieves a GoogleGenAI client.
 */
function createGeminiClient(options = {}) {
  const apiKey = options.apiKey !== undefined ? options.apiKey : env.geminiApiKey;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Core text generation with Gemini
 */
async function generateText({
  prompt,
  systemInstruction,
  model = env.geminiModel || "gemini-3.8-flash",
  temperature = 0.2,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  strict = false,
  client = undefined
} = {}) {
  const isStrict = Boolean(strict || process.env.REQUIRE_GEMINI === "true");
  const ai = client !== undefined ? client : createGeminiClient();

  if (!ai) {
    if (isStrict) {
      const err = new Error("Google Gemini API key is missing and strict mode is enabled.");
      err.code = "GEMINI_KEY_MISSING";
      throw err;
    }
    return {
      success: true,
      text: "",
      provider: "fallback",
      isFallback: true,
      warning: "Gemini API key not configured. Fallback mode active."
    };
  }

  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const config = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (typeof temperature === "number") config.temperature = temperature;
      if (env.geminiThinkingBudget !== undefined && !isNaN(env.geminiThinkingBudget)) {
        config.thinkingConfig = { thinkingBudget: Number(env.geminiThinkingBudget) };
      }

      // AbortController timeout protection
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const requestOptions = { signal: controller.signal };
      let response;
      try {
        response = await ai.models.generateContent(
          {
            model,
            contents: prompt,
            config
          },
          requestOptions
        );
      } finally {
        clearTimeout(timer);
      }

      const text = response?.text ? response.text.trim() : "";
      return {
        success: true,
        text,
        model,
        provider: "gemini",
        isFallback: false
      };
    } catch (err) {
      lastError = err;
      const sanitized = sanitizeError(err);

      // Check if timeout or abort
      if (err.name === "AbortError" || sanitized.toLowerCase().includes("timeout") || sanitized.toLowerCase().includes("aborted")) {
        const timeoutErr = new Error(`Gemini request timed out after ${timeoutMs}ms`);
        timeoutErr.code = "GEMINI_TIMEOUT";
        if (isStrict) throw timeoutErr;
        return {
          success: false,
          error: timeoutErr.message,
          provider: "gemini",
          isFallback: true
        };
      }

      // Retry on 429 (rate limit) or 503 (service unavailable)
      const isRateLimit = sanitized.includes("429") || sanitized.toLowerCase().includes("quota") || sanitized.toLowerCase().includes("rate limit");
      const isTransient = sanitized.includes("503") || sanitized.includes("500");
      if ((isRateLimit || isTransient) && attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 800;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }

  const cleanMessage = sanitizeError(lastError);
  if (isStrict) {
    const errorObj = new Error(`Gemini text generation failed: ${cleanMessage}`);
    errorObj.code = "GEMINI_API_ERROR";
    errorObj.originalError = lastError;
    throw errorObj;
  }

  return {
    success: false,
    error: cleanMessage,
    provider: "gemini",
    isFallback: true
  };
}

/**
 * Strips potential markdown markdown code fences from JSON output.
 */
function cleanJsonOutput(raw) {
  if (!raw || typeof raw !== "string") return "";
  let trimmed = raw.trim();
  // Strip ```json ... ``` or ``` ... ```
  if (trimmed.startsWith("```")) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed.trim();
}

/**
 * Generates structured JSON output using Gemini and validates with Zod schema.
 */
async function generateStructuredJson({
  prompt,
  systemInstruction,
  schema = null,
  model = env.geminiModel || "gemini-3.8-flash",
  temperature = 0.1,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  strict = false,
  client = undefined
} = {}) {
  const isStrict = Boolean(strict || process.env.REQUIRE_GEMINI === "true");
  const ai = client !== undefined ? client : createGeminiClient();

  if (!ai) {
    if (isStrict) {
      const err = new Error("Google Gemini API key is missing and strict mode is enabled.");
      err.code = "GEMINI_KEY_MISSING";
      throw err;
    }
    return {
      success: false,
      error: "Gemini API key not configured",
      provider: "fallback",
      isFallback: true
    };
  }

  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const config = {
        responseMimeType: "application/json"
      };
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (typeof temperature === "number") config.temperature = temperature;
      if (env.geminiThinkingBudget !== undefined && !isNaN(env.geminiThinkingBudget)) {
        config.thinkingConfig = { thinkingBudget: Number(env.geminiThinkingBudget) };
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response;
      try {
        response = await ai.models.generateContent(
          {
            model,
            contents: prompt,
            config
          },
          { signal: controller.signal }
        );
      } finally {
        clearTimeout(timer);
      }

      const rawText = response?.text || "";
      const cleaned = cleanJsonOutput(rawText);

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new Error(`Malformed JSON output returned by Gemini: ${parseErr.message}`);
      }

      // If a Zod schema is provided, validate structured output
      if (schema && typeof schema.parse === "function") {
        parsed = schema.parse(parsed);
      }

      return {
        success: true,
        data: parsed,
        model,
        provider: "gemini",
        isFallback: false
      };
    } catch (err) {
      lastError = err;
      const sanitized = sanitizeError(err);

      if (err.name === "AbortError" || sanitized.toLowerCase().includes("timeout")) {
        const timeoutErr = new Error(`Gemini structured request timed out after ${timeoutMs}ms`);
        timeoutErr.code = "GEMINI_TIMEOUT";
        if (isStrict) throw timeoutErr;
        return {
          success: false,
          error: timeoutErr.message,
          provider: "gemini",
          isFallback: true
        };
      }

      const isRateLimit = sanitized.includes("429") || sanitized.toLowerCase().includes("quota") || sanitized.toLowerCase().includes("rate limit");
      const isTransient = sanitized.includes("503") || sanitized.includes("500");
      if ((isRateLimit || isTransient) && attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 800;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }

  const cleanMessage = sanitizeError(lastError);
  if (isStrict) {
    const errorObj = new Error(`Gemini structured generation failed: ${cleanMessage}`);
    errorObj.code = "GEMINI_API_ERROR";
    errorObj.originalError = lastError;
    throw errorObj;
  }

  return {
    success: false,
    error: cleanMessage,
    provider: "gemini",
    isFallback: true
  };
}

/**
 * Validates actual connectivity and authentication against the Google Gemini API.
 */
async function validateGeminiConnection(options = {}) {
  const apiKey = options.apiKey !== undefined ? options.apiKey : env.geminiApiKey;
  const model = options.model || env.geminiModel || "gemini-3.8-flash";

  if (!apiKey) {
    return {
      ok: false,
      status: "FAIL — CONFIGURATION",
      code: "MISSING_API_KEY",
      message: "GEMINI_API_KEY is not configured in the environment."
    };
  }

  const startTime = Date.now();
  const ai = new GoogleGenAI({ apiKey });
  const config = {
    temperature: 0.1
  };
  if (env.geminiThinkingBudget !== undefined && !isNaN(env.geminiThinkingBudget)) {
    config.thinkingConfig = { thinkingBudget: Number(env.geminiThinkingBudget) };
  }

  let lastError = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: "Reply with pong",
        config
      });

      const text = res?.text ? res.text.trim() : "";
      const latencyMs = Date.now() - startTime;

      return {
        ok: true,
        status: "PASS",
        model,
        latencyMs,
        responseSample: text.slice(0, 50),
        message: `Successfully connected to Gemini API with model ${model} (${latencyMs}ms)`
      };
    } catch (err) {
      lastError = err;
      const cleanMsg = sanitizeError(err);
      if ((cleanMsg.includes("503") || cleanMsg.includes("429")) && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, (attempt + 1) * 1200));
        continue;
      }
      break;
    }
  }

  try {
    throw lastError;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const cleanMsg = sanitizeError(err);
    const lower = cleanMsg.toLowerCase();

    let status = "FAIL — CONNECTIVITY";
    let code = "CONNECTION_ERROR";

    if (lower.includes("401") || lower.includes("403") || lower.includes("api key not valid") || lower.includes("unauthenticated") || lower.includes("permission denied")) {
      status = "FAIL — AUTHENTICATION";
      code = "INVALID_CREDENTIALS";
    } else if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("rate limit")) {
      status = "FAIL — RATE_LIMITED";
      code = "RATE_LIMIT_EXCEEDED";
    } else if (lower.includes("404") || lower.includes("not found") || lower.includes("is not supported") || lower.includes("unknown model") || lower.includes("no longer available")) {
      status = "FAIL — CONFIGURATION";
      code = "MODEL_UNAVAILABLE";
    } else if (lower.includes("enotfound") || lower.includes("econnrefused") || lower.includes("etimedout") || lower.includes("abort")) {
      status = "FAIL — CONNECTIVITY";
      code = "NETWORK_ERROR";
    }

    return {
      ok: false,
      status,
      code,
      model,
      latencyMs,
      message: cleanMsg
    };
  }
}

module.exports = {
  createGeminiClient,
  generateText,
  generateStructuredJson,
  validateGeminiConnection,
  cleanJsonOutput,
  sanitizeError
};

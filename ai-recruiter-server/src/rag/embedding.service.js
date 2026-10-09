const EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5";
const EMBEDDING_DIMENSIONS = 384;
const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

async function generateEmbedding(text, options = {}) {
  const str = String(text || "").trim();
  const hfKey = options.apiKey || process.env.HUGGINGFACE_API_KEY || process.env.HF_API_KEY;
  const isStrict = Boolean(options.strict || process.env.REQUIRE_SEMANTIC_EMBEDDINGS === "true");

  if (hfKey && str.length > 0) {
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

        const response = await fetch(`https://api-inference.huggingface.co/models/${EMBEDDING_MODEL}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ inputs: str }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          let data = await response.json();
          // Hugging Face feature extraction can return [0.1, ...] or [[0.1, ...]]
          if (Array.isArray(data) && Array.isArray(data[0])) {
            data = data[0];
          }

          if (Array.isArray(data) && data.length === EMBEDDING_DIMENSIONS) {
            const allValidNumbers = data.every((val) => typeof val === "number" && Number.isFinite(val));
            if (allValidNumbers) {
              // Ensure L2 normalization for cosine similarity
              let norm = 0;
              for (let i = 0; i < data.length; i++) norm += data[i] * data[i];
              norm = Math.sqrt(norm);
              const normalized = norm > 0 ? data.map((v) => v / norm) : data;

              return {
                vector: normalized,
                dimensions: normalized.length,
                model: EMBEDDING_MODEL,
                provider: "huggingface",
                isFallback: false
              };
            }
          }
          throw new Error(`Invalid embedding response shape: expected ${EMBEDDING_DIMENSIONS} numbers, got ${Array.isArray(data) ? data.length : typeof data}`);
        }

        // Retry on 503 (model loading) or 429 (rate limit)
        if ((response.status === 503 || response.status === 429) && attempt < MAX_RETRIES) {
          const delay = (attempt + 1) * 600;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }

        const errBody = await response.text().catch(() => "");
        throw new Error(`Hugging Face API returned HTTP ${response.status}: ${errBody}`);
      } catch (err) {
        lastError = err;
        if (attempt < MAX_RETRIES && (err.name === "AbortError" || err.message?.includes("fetch"))) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
      }
    }

    if (isStrict) {
      throw Object.assign(
        new Error(`Semantic embedding generation failed for ${EMBEDDING_MODEL}: ${lastError?.message || "Unknown error"}`),
        { code: "EMBEDDING_PROVIDER_UNAVAILABLE", originalError: lastError }
      );
    }
  } else if (isStrict) {
    throw Object.assign(
      new Error(`Semantic embedding provider required but no HUGGINGFACE_API_KEY is configured. Hash fallback disabled in strict mode.`),
      { code: "EMBEDDING_KEY_MISSING" }
    );
  }

  // Deterministic 384-dimensional normalized vector (fallback mode)
  const vector = hashTextToVector(str, EMBEDDING_DIMENSIONS);
  return {
    vector,
    dimensions: EMBEDDING_DIMENSIONS,
    model: EMBEDDING_MODEL,
    fallbackModel: "fallback-lexical-hash-384",
    provider: "hash-deterministic-fallback",
    isFallback: true,
    warning: "Deterministic hash vector used as fallback. Not a semantic embedding model."
  };
}

function hashTextToVector(text, size = EMBEDDING_DIMENSIONS) {
  const vector = new Array(size).fill(0);
  const str = String(text || "").trim().toLowerCase();
  if (!str) return vector;

  // Use words, unigrams and bigrams for richer lexical representation
  const words = str.split(/\s+/).filter(Boolean);
  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    for (let i = 0; i < word.length; i++) {
      const code = word.charCodeAt(i);
      const bucket = ((code * 31 + i * 17 + w) % size + size) % size;
      vector[bucket] += 1;
    }
    if (w < words.length - 1) {
      const nextWord = words[w + 1];
      const bigramHash = ((word.charCodeAt(0) * 43 + nextWord.charCodeAt(0) * 59) % size + size) % size;
      vector[bigramHash] += 1.5;
    }
  }

  let norm = 0;
  for (let i = 0; i < size; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < size; i++) {
      vector[i] = vector[i] / norm;
    }
  }
  return vector;
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dotProduct = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
  }
  return Math.min(1, Math.max(-1, dotProduct));
}

module.exports = {
  generateEmbedding,
  hashTextToVector,
  cosineSimilarity,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS
};

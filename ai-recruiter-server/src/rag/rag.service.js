const { env } = require("../config/env");
const { loadRagSpec } = require("../utils/specLoader");
const {
  hashTextToVector,
  generateEmbedding,
  cosineSimilarity,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS
} = require("./embedding.service");

const memoryStore = [];
const vectorSize = EMBEDDING_DIMENSIONS; // 384 dimensions for BAAI/bge-small-en-v1.5

function qdrantHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (env.qdrantApiKey) {
    headers["api-key"] = env.qdrantApiKey;
  }
  return headers;
}

async function ensureCollection() {
  const collectionUrl = `${env.qdrantUrl}/collections/${env.qdrantCollection}`;
  try {
    const res = await fetch(collectionUrl, { headers: qdrantHeaders() });
    if (res.ok) return true;
    if (res.status === 404) {
      const createRes = await fetch(collectionUrl, {
        method: "PUT",
        headers: qdrantHeaders(),
        body: JSON.stringify({
          vectors: {
            size: vectorSize,
            distance: "Cosine"
          }
        })
      });
      return createRes.ok;
    }
  } catch {
    return false;
  }
  return false;
}

function chunkDocument(text, type = "resume") {
  const str = String(text || "").trim();
  if (!str) return [];
  // Spec: Resume chunks 500 chars, Policy chunks 1000 chars
  const chunkSize = type === "policy" ? 1000 : 500;
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

async function storeDocument({ id, type, text, metadata = {}, options = {} }) {
  const chunks = chunkDocument(text, type);
  const points = [];
  let detectedProvider = "in-memory-fallback";
  let detectedModel = EMBEDDING_MODEL;

  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    const embResult = await generateEmbedding(chunk, options);
    detectedProvider = embResult.provider;
    detectedModel = embResult.model;
    points.push({
      id: `${id || "doc"}_${index}`,
      vector: embResult.vector,
      payload: {
        documentId: id,
        type,
        chunkIndex: index,
        chunkText: chunk,
        metadata: {
          ...metadata,
          recruiter_id: metadata?.recruiter_id || "",
          job_id: metadata?.job_id || ""
        }
      }
    });
  }

  // Keep in memoryStore for offline / fallback search
  for (const pt of points) {
    const idx = memoryStore.findIndex((m) => m.id === pt.id);
    if (idx >= 0) {
      memoryStore[idx] = pt;
    } else {
      memoryStore.push(pt);
    }
  }

  let qdrantError = null;
  // Attempt Qdrant upsert
  try {
    const collectionReady = await ensureCollection();
    if (collectionReady) {
      const upsertRes = await fetch(`${env.qdrantUrl}/collections/${env.qdrantCollection}/points`, {
        method: "PUT",
        headers: qdrantHeaders(),
        body: JSON.stringify({ points })
      });
      if (upsertRes.ok) {
        return {
          stored: points.length,
          dimensions: vectorSize,
          model: detectedModel,
          embeddingProvider: detectedProvider,
          provider: "qdrant",
          isPersistent: true
        };
      }
      qdrantError = new Error(`Qdrant upsert returned HTTP ${upsertRes.status}`);
    } else {
      qdrantError = new Error(`Failed to ensure collection at ${env.qdrantUrl}`);
    }
  } catch (err) {
    qdrantError = err;
  }

  const requirePersistent = Boolean(
    options?.requirePersistent ||
    process.env.REQUIRE_PERSISTENT_STORAGE === "true"
  );
  if (requirePersistent) {
    throw Object.assign(
      new Error(`Persistent Qdrant storage is required but unavailable at ${env.qdrantUrl}: ${qdrantError?.message || "Service offline"}`),
      { code: "QDRANT_PERSISTENCE_REQUIRED", originalError: qdrantError }
    );
  }

  return {
    stored: points.length,
    dimensions: vectorSize,
    model: detectedModel,
    embeddingProvider: detectedProvider,
    provider: "in-memory-fallback",
    isPersistent: false,
    warning: "Vector stored in non-persistent in-memory fallback. Production persistence requires running Qdrant instance."
  };
}

async function searchContext(query, filter = {}, options = {}) {
  const ragSpec = loadRagSpec();
  const topK = ragSpec?.top_k ?? 5;
  const minSim = ragSpec?.minimum_similarity ?? 0.75;
  const embResult = await generateEmbedding(query, options);
  const queryVector = embResult.vector;

  // Try Qdrant if reachable
  try {
    const searchBody = {
      vector: queryVector,
      limit: topK,
      score_threshold: minSim,
      with_payload: true
    };

    const mustFilters = [];
    if (filter?.recruiter_id) {
      mustFilters.push({ key: "metadata.recruiter_id", match: { value: filter.recruiter_id } });
    }
    if (filter?.job_id) {
      mustFilters.push({ key: "metadata.job_id", match: { value: filter.job_id } });
    }
    if (mustFilters.length > 0) {
      searchBody.filter = { must: mustFilters };
    }

    const qdrantRes = await fetch(`${env.qdrantUrl}/collections/${env.qdrantCollection}/points/search`, {
      method: "POST",
      headers: qdrantHeaders(),
      body: JSON.stringify(searchBody)
    });

    if (qdrantRes.ok) {
      const body = await qdrantRes.json();
      if (Array.isArray(body?.result) && body.result.length > 0) {
        return body.result.map((r) => ({
          id: r.id,
          score: r.score,
          text: r.payload?.chunkText || "",
          metadata: r.payload?.metadata || {},
          provider: "qdrant"
        }));
      }
    }
  } catch {
    // Fallback to memory
  }

  const requirePersistent = Boolean(
    options?.requirePersistent ||
    process.env.REQUIRE_PERSISTENT_STORAGE === "true"
  );
  if (requirePersistent) {
    throw Object.assign(
      new Error(`Persistent Qdrant search is required but service at ${env.qdrantUrl} is unreachable.`),
      { code: "QDRANT_SEARCH_UNAVAILABLE" }
    );
  }

  // Filter in-memory points for strict tenant isolation
  const candidatePoints = memoryStore.filter((pt) => {
    const meta = pt.payload?.metadata || {};
    if (filter?.recruiter_id && meta.recruiter_id && meta.recruiter_id !== filter.recruiter_id) {
      return false;
    }
    if (filter?.job_id && meta.job_id && meta.job_id !== filter.job_id) {
      return false;
    }
    return true;
  });

  const results = candidatePoints
    .map((pt) => ({
      id: pt.id,
      score: cosineSimilarity(queryVector, pt.vector),
      text: pt.payload.chunkText,
      metadata: pt.payload.metadata,
      provider: "in-memory-fallback"
    }))
    .filter((r) => r.score >= minSim)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}

async function deleteDocument(id) {
  for (let i = memoryStore.length - 1; i >= 0; i--) {
    if (memoryStore[i].payload?.documentId === id || memoryStore[i].id.startsWith(`${id}_`)) {
      memoryStore.splice(i, 1);
    }
  }

  try {
    const res = await fetch(`${env.qdrantUrl}/collections/${env.qdrantCollection}/points/delete`, {
      method: "POST",
      headers: qdrantHeaders(),
      body: JSON.stringify({
        filter: {
          must: [{ key: "documentId", match: { value: id } }]
        }
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = {
  storeDocument,
  searchContext,
  chunkDocument,
  ensureCollection,
  deleteDocument,
  memoryStore,
  vectorSize,
  EMBEDDING_MODEL
};

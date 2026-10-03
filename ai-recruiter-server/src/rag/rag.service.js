const { env } = require("../config/env");
const { loadRagSpec } = require("../utils/specLoader");
const { hashTextToVector, cosineSimilarity } = require("./embedding.service");

const memoryStore = [];
const vectorSize = 64;

function qdrantHeaders() {
  // TODO: Return the JSON content type plus the Qdrant api-key header when configured.
  return {};
}

async function ensureCollection() {
  // TODO: Check whether the Qdrant collection exists and create it with the cosine
  // TODO: distance vector config when it does not.
}

function chunkDocument(text, type) {
  // TODO: Split the text into chunks using the resume or policy size from the RAG spec.
  return [];
}

async function storeDocument({ id, type, text, metadata }) {
  // TODO: Chunk and embed the document, keep the points in the memory store, and upsert
  // TODO: them into Qdrant, reporting the memory fallback when the upsert fails.
  return { stored: 0, provider: "not-implemented" };
}

async function searchContext(query) {
  // TODO: Embed the query, search Qdrant with the spec top_k and similarity threshold,
  // TODO: and fall back to scoring the in-memory points when Qdrant is unavailable.
  return [];
}

module.exports = { storeDocument, searchContext, chunkDocument };

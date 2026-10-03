const ragService = require("../rag/rag.service");

async function runEmbeddingAgent({ candidate, parsedResume }) {
  // TODO: Store the parsed resume in the vector store with the candidate and job metadata
  // TODO: and return { success, data: storageResult }.
  throw new Error("Embedding agent is not implemented yet");
}

module.exports = { runEmbeddingAgent };

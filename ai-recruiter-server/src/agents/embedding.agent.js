const ragService = require("../rag/rag.service");

async function runEmbeddingAgent({ candidate, parsedResume, job }) {
  const text = [
    parsedResume?.name,
    Array.isArray(parsedResume?.skills) ? parsedResume.skills.join(" ") : "",
    parsedResume?.experience ? `${parsedResume.experience} years experience` : "",
    parsedResume?.education || ""
  ].filter(Boolean).join(". ");

  const candidateId = candidate?._id ? candidate._id.toString() : (candidate?.id || "candidate_doc");
  const jobId = job?._id ? job._id.toString() : (candidate?.job_id ? candidate.job_id.toString() : "");
  const recruiterId = job?.created_by ? job.created_by.toString() : "";

  const storageResult = await ragService.storeDocument({
    id: candidateId,
    type: "resume",
    text,
    metadata: {
      candidate_id: candidateId,
      job_id: jobId,
      recruiter_id: recruiterId
    }
  });

  return {
    success: true,
    data: storageResult
  };
}

module.exports = { runEmbeddingAgent };

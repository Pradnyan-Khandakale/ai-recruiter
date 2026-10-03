const path = require("path");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const Workflow = require("../models/Workflow");
const WorkflowLog = require("../models/WorkflowLog");
const ragService = require("../rag/rag.service");
const { runResumeParser } = require("../agents/resumeParser.agent");
const { runEmbeddingAgent } = require("../agents/embedding.agent");
const { runMatchingAgent } = require("../agents/matching.agent");
const { runShortlistingAgent } = require("../agents/shortlisting.agent");
const { runInterviewAgent } = require("../agents/interview.agent");
const { runEmailAgent } = require("../agents/email.agent");
const { loadHiringSpec, loadWorkflowSpec, loadRetryPolicy, loadNodeStateSpec, loadShortlistingRules } = require("../utils/specLoader");
const { appendWorkflowFailure } = require("../utils/fileLog");

async function createLog(workflow, agentName, input, output, status, retryCount = 0) {
  // TODO: Persist a WorkflowLog entry for this agent run.
  return null;
}

function getRetryCount(workflow, agentName) {
  // TODO: Read the stored retry count for this agent.
  return 0;
}

async function setRetryCount(workflow, agentName, count) {
  // TODO: Store the retry count for this agent and save the workflow.
}

async function runStep(workflow, agentName, handler, input) {
  // TODO: Run the agent handler with retry logging: log the running, success, and failed
  // TODO: states, append the failure to the file log, honour the retry policy limits and
  // TODO: the retryable flag, and mark the workflow failed when retries are exhausted.
  throw new Error("Workflow step runner is not implemented yet");
}

async function executeWorkflow(workflow) {
  // TODO: Load the candidate, job, hiring spec, workflow spec, and shortlisting rules,
  // TODO: then walk the spec order: pause at human_approval, skip completed steps, and
  // TODO: run the resume parser, embedding, matching, shortlisting, interview, and email
  // TODO: agents while persisting their output onto the workflow and candidate.
  throw new Error("Workflow execution is not implemented yet");
}

async function startWorkflow(candidateId, jobId) {
  // TODO: Create a pending workflow for the candidate and job, then execute it.
  throw Object.assign(new Error("Start workflow service is not implemented yet"), { statusCode: 501 });
}

async function retryWorkflow(workflowId) {
  // TODO: Load the workflow, set it back to running, and execute it again.
  throw Object.assign(new Error("Retry workflow service is not implemented yet"), { statusCode: 501 });
}

async function approveWorkflow(workflowId, approved) {
  // TODO: Record the human approval flag on the workflow state and resume execution.
  throw Object.assign(new Error("Approve workflow service is not implemented yet"), { statusCode: 501 });
}

async function getWorkflow(id) {
  // TODO: Return the populated workflow, its ordered logs, and the node state spec.
  throw Object.assign(new Error("Get workflow service is not implemented yet"), { statusCode: 501 });
}

async function listWorkflows() {
  // TODO: Return every populated workflow with its logs, spec order, and node states.
  throw Object.assign(new Error("List workflows service is not implemented yet"), { statusCode: 501 });
}

module.exports = { startWorkflow, retryWorkflow, approveWorkflow, getWorkflow, listWorkflows, executeWorkflow };

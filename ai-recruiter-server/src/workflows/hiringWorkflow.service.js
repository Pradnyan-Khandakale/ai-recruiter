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
const {
  loadHiringSpec,
  loadWorkflowSpec,
  loadRetryPolicy,
  loadNodeStateSpec,
  loadShortlistingRules
} = require("../utils/specLoader");
const { appendWorkflowFailure } = require("../utils/fileLog");

async function checkWorkflowOwnership(workflow, user) {
  if (!user || user.role === "admin") return;
  const job = await Job.findById(workflow.job_id);
  if (!job) {
    throw Object.assign(new Error("Job associated with this workflow not found"), { statusCode: 404 });
  }
  if (job.created_by.toString() !== user.id.toString()) {
    throw Object.assign(
      new Error("Access denied: You do not own this workflow's job"),
      { statusCode: 403 }
    );
  }
}

async function createLog(workflow, agentName, input, output, status, retryCount = 0, error = null) {
  try {
    return await WorkflowLog.create({
      workflow_id: workflow._id,
      agent_name: agentName,
      input: input ? JSON.parse(JSON.stringify(input)) : null,
      output: output ? JSON.parse(JSON.stringify(output)) : null,
      status,
      error: error ? String(error) : null,
      retry_count: retryCount
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.error(`Failed to persist WorkflowLog for ${agentName}:`, err.message);
    }
    return null;
  }
}

function getRetryCount(workflow, agentName) {
  if (workflow.retries instanceof Map) {
    return workflow.retries.get(agentName) || 0;
  }
  return workflow.retries?.[agentName] || 0;
}

async function setRetryCount(workflow, agentName, count) {
  if (workflow.retries instanceof Map) {
    workflow.retries.set(agentName, count);
  } else {
    if (!workflow.retries) workflow.retries = {};
    workflow.retries[agentName] = count;
  }
  workflow.markModified("retries");
  await workflow.save();
}

async function runStep(workflow, agentName, handler, input) {
  const retryPolicy = loadRetryPolicy();
  const maxRetries = retryPolicy?.max_retries ?? 3;
  const currentRetry = getRetryCount(workflow, agentName);

  await createLog(workflow, agentName, input, null, "running", currentRetry);

  try {
    const result = await handler(input);
    if (!result || result.success === false) {
      throw new Error(result?.error || `${agentName} execution failed`);
    }
    await createLog(workflow, agentName, input, result, "success", currentRetry);
    return result;
  } catch (err) {
    const nextRetry = currentRetry + 1;
    await setRetryCount(workflow, agentName, nextRetry);
    await createLog(workflow, agentName, input, null, "failed", nextRetry, err.message);

    appendWorkflowFailure({
      agent_name: agentName,
      workflow_id: workflow._id,
      workflow_state: workflow.current_state,
      retry_count: nextRetry,
      error: err.message,
      stack: err.stack
    });

    if (nextRetry >= maxRetries) {
      workflow.status = "failed";
      await workflow.save();
    }
    throw err;
  }
}

async function executeWorkflow(workflow) {
  workflow.status = "running";
  await workflow.save();

  const candidate = await Candidate.findById(workflow.candidate_id);
  const job = await Job.findById(workflow.job_id);

  if (!candidate || !job) {
    workflow.status = "failed";
    await workflow.save().catch(() => {});
    return workflow;
  }

  // Spec compliance: Use job's actual hiring criteria rather than generic fallbacks
  const baseSpec = loadHiringSpec(job.workflow_spec_id || "frontend-developer");
  const hiringSpec = {
    ...baseSpec,
    role: job.title || baseSpec.role,
    required_skills: (Array.isArray(job.required_skills) && job.required_skills.length > 0)
      ? job.required_skills
      : baseSpec.required_skills,
    preferred_skills: (Array.isArray(job.preferred_skills) && job.preferred_skills.length > 0)
      ? job.preferred_skills
      : baseSpec.preferred_skills,
    min_experience: typeof job.min_experience === "number"
      ? job.min_experience
      : (baseSpec.min_experience || 0),
    minimum_score: typeof job.minimum_score === "number"
      ? job.minimum_score
      : (baseSpec.minimum_score || 75)
  };

  const workflowSpec = loadWorkflowSpec();
  const shortlistingRules = loadShortlistingRules();
  const steps = workflowSpec?.workflow || [
    "resume_parser",
    "embedding_agent",
    "matching_agent",
    "shortlisting_agent",
    "human_approval",
    "interview_agent",
    "email_agent"
  ];

  if (!workflow.state) workflow.state = {};

  let resumeFilePath = "";
  if (candidate.resume_url) {
    const uploadsDir = path.join(__dirname, "..", "..", "uploads");
    const filename = path.basename(candidate.resume_url);
    resumeFilePath = path.join(uploadsDir, filename);
  }

  for (const step of steps) {
    workflow.current_state = step;
    await workflow.save();

    if (step === "resume_parser") {
      if (!workflow.state.parsed_resume) {
        const res = await runStep(workflow, "resume_parser", runResumeParser, {
          candidate,
          filePath: resumeFilePath,
          hiringSpec
        });
        workflow.state.parsed_resume = res.data;
        if (res.data?.skills && res.data.skills.length > 0) {
          candidate.skills = res.data.skills;
        }
        candidate.parsed_resume_json = res.data;
        await candidate.save();
        workflow.markModified("state");
        await workflow.save();
      }
    } else if (step === "embedding_agent") {
      if (!workflow.state.embedding) {
        const res = await runStep(workflow, "embedding_agent", runEmbeddingAgent, {
          candidate,
          parsedResume: workflow.state.parsed_resume,
          job
        });
        workflow.state.embedding = res.data;
        workflow.markModified("state");
        await workflow.save();
      }
    } else if (step === "matching_agent") {
      if (!workflow.state.matching) {
        const queryText = `${candidate.name || ""} ${(candidate.skills || []).join(" ")}`;
        // Tenant-isolated RAG search
        const ragContext = await ragService.searchContext(queryText, {
          recruiter_id: job.created_by?.toString(),
          job_id: job._id?.toString()
        });
        const res = await runStep(workflow, "matching_agent", runMatchingAgent, {
          parsedResume: workflow.state.parsed_resume,
          hiringSpec,
          ragContext,
          shortlistingRules
        });
        workflow.state.matching = res.data;
        candidate.match_score = res.data.match_score;
        await candidate.save();
        workflow.markModified("state");
        await workflow.save();
      }
    } else if (step === "shortlisting_agent") {
      if (!workflow.state.shortlisting) {
        const res = await runStep(workflow, "shortlisting_agent", runShortlistingAgent, {
          matching: { data: workflow.state.matching },
          candidate,
          job
        });
        workflow.state.shortlisting = res.data;
        workflow.markModified("state");
        await workflow.save();
      }
    } else if (step === "human_approval") {
      if (workflow.state.approved === undefined) {
        workflow.status = "waiting_approval";
        await workflow.save();
        await createLog(workflow, "human_approval", null, null, "waiting_approval");
        return workflow;
      }
      await createLog(
        workflow,
        "human_approval",
        { approved: workflow.state.approved },
        { approved: workflow.state.approved },
        "success"
      );
    } else if (step === "interview_agent") {
      if (workflow.state.approved !== false && !workflow.state.interview) {
        const res = await runStep(workflow, "interview_agent", runInterviewAgent, {
          candidate,
          job,
          hiringSpec
        });
        workflow.state.interview = res.data;
        workflow.markModified("state");
        await workflow.save();
      }
    } else if (step === "email_agent") {
      // Idempotency: avoid sending duplicate emails on retries or resume
      if (!workflow.state.email) {
        const res = await runStep(workflow, "email_agent", runEmailAgent, {
          candidate,
          job,
          shortlisting: { data: workflow.state.shortlisting }
        });
        workflow.state.email = { provider: res.provider || (res.data && res.data.provider) || "fallback", ...(res.data || {}) };
        workflow.markModified("state");
        await workflow.save();
      }
    }
  }

  workflow.status = "completed";
  workflow.current_state = "completed";
  await workflow.save();

  if (workflow.state.shortlisting?.status === "shortlisted" && workflow.state.approved !== false) {
    candidate.status = "interview";
  } else if (workflow.state.shortlisting?.status === "rejected" || workflow.state.approved === false) {
    candidate.status = "rejected";
  } else {
    candidate.status = "reviewed";
  }
  await candidate.save();

  return workflow;
}

async function startWorkflow(candidateId, jobId, user = null) {
  if (user && user.role !== "admin") {
    const job = await Job.findById(jobId);
    if (!job) {
      throw Object.assign(new Error("Job not found"), { statusCode: 404 });
    }
    if (job.created_by.toString() !== user.id.toString()) {
      throw Object.assign(new Error("Access denied: You do not own this job"), { statusCode: 403 });
    }
  }

  let existing = await Workflow.findOne({ candidate_id: candidateId, job_id: jobId });
  if (existing && ["pending", "running", "waiting_approval", "completed"].includes(existing.status)) {
    return existing;
  }

  const workflow = await Workflow.create({
    candidate_id: candidateId,
    job_id: jobId,
    status: "pending",
    current_state: "resume_parser"
  });

  setImmediate(() => {
    executeWorkflow(workflow).catch((err) => {
      if (process.env.NODE_ENV !== "test") {
        console.error(`Workflow ${workflow._id} failed:`, err.message);
      }
    });
  });

  return workflow;
}

async function retryWorkflow(workflowId, user = null) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw Object.assign(new Error("Workflow not found"), { statusCode: 404 });
  }

  await checkWorkflowOwnership(workflow, user);

  // Validate state transition: only failed workflows can be retried
  if (workflow.status !== "failed") {
    throw Object.assign(
      new Error(`Invalid workflow transition: only failed workflows can be retried (current status: '${workflow.status}')`),
      { statusCode: 400 }
    );
  }

  workflow.status = "running";
  await workflow.save();

  setImmediate(() => {
    executeWorkflow(workflow).catch((err) => {
      if (process.env.NODE_ENV !== "test") {
        console.error(`Retry workflow ${workflow._id} failed:`, err.message);
      }
    });
  });

  return workflow;
}

async function approveWorkflow(workflowId, approved = true, user = null) {
  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw Object.assign(new Error("Workflow not found"), { statusCode: 404 });
  }

  await checkWorkflowOwnership(workflow, user);

  // Validate state transition: can only approve when paused at waiting_approval
  if (workflow.status !== "waiting_approval") {
    throw Object.assign(
      new Error(`Invalid workflow transition: cannot approve workflow in '${workflow.status}' state`),
      { statusCode: 400 }
    );
  }

  if (!workflow.state) workflow.state = {};
  workflow.state.approved = Boolean(approved);
  workflow.status = "running";
  workflow.markModified("state");
  await workflow.save();

  setImmediate(() => {
    executeWorkflow(workflow).catch((err) => {
      if (process.env.NODE_ENV !== "test") {
        console.error(`Resume approved workflow ${workflow._id} failed:`, err.message);
      }
    });
  });

  return workflow;
}

async function getWorkflow(id, user = null) {
  const workflow = await Workflow.findById(id)
    .populate("candidate_id")
    .populate("job_id");

  if (!workflow) {
    throw Object.assign(new Error("Workflow not found"), { statusCode: 404 });
  }

  await checkWorkflowOwnership(workflow, user);

  const logs = await WorkflowLog.find({ workflow_id: workflow._id }).sort({ created_at: 1 });
  const nodeStates = loadNodeStateSpec();
  const workflowSpec = loadWorkflowSpec();

  return {
    workflow,
    logs,
    execution_order: workflowSpec?.workflow || [],
    node_states: nodeStates
  };
}

async function listWorkflows(user = null) {
  let query = {};
  if (user && user.role !== "admin") {
    const userJobs = await Job.find({ created_by: user.id }).select("_id");
    const jobIds = userJobs.map((j) => j._id);
    query = { job_id: { $in: jobIds } };
  }

  const workflows = await Workflow.find(query)
    .populate("candidate_id")
    .populate("job_id")
    .sort({ created_at: -1 });

  const nodeStates = loadNodeStateSpec();
  const workflowSpec = loadWorkflowSpec();

  const workflowIds = workflows.map((w) => w._id);
  const allLogs = await WorkflowLog.find({ workflow_id: { $in: workflowIds } }).sort({ created_at: 1 });
  const logsByWorkflow = {};
  for (const log of allLogs) {
    const wId = log.workflow_id.toString();
    if (!logsByWorkflow[wId]) logsByWorkflow[wId] = [];
    logsByWorkflow[wId].push(log);
  }

  const items = workflows.map((w) => ({
    workflow: w,
    logs: logsByWorkflow[w._id.toString()] || [],
    workflow_order: workflowSpec?.workflow || [],
    node_states: nodeStates
  }));

  return {
    workflows,
    items,
    execution_order: workflowSpec?.workflow || [],
    node_states: nodeStates
  };
}

module.exports = {
  startWorkflow,
  retryWorkflow,
  approveWorkflow,
  getWorkflow,
  listWorkflows,
  executeWorkflow,
  runStep,
  createLog,
  checkWorkflowOwnership
};

const mongoose = require("mongoose");
const Job = require("../models/Job");
const Application = require("../models/Application");
const Candidate = require("../models/Candidate");
const Workflow = require("../models/Workflow");
const WorkflowLog = require("../models/WorkflowLog");

async function getRecruiterAnalytics(user, query = {}) {
  // 1. Determine scoped Job IDs for tenant isolation
  let jobFilter = {};
  if (user.role !== "admin") {
    jobFilter.created_by = new mongoose.Types.ObjectId(user.id);
  }

  const ownedJobs = await Job.find(jobFilter).select("_id title status created_by created_at");
  const ownedJobIds = ownedJobs.map((j) => j._id);

  if (query.job_id) {
    if (!mongoose.Types.ObjectId.isValid(query.job_id)) {
      throw Object.assign(new Error("Invalid job ID format"), { statusCode: 400 });
    }
    const isOwned = ownedJobIds.some((id) => id.toString() === query.job_id.toString());
    if (!isOwned) {
      throw Object.assign(
        new Error("Access denied: You do not have permission to view analytics for this job"),
        { statusCode: 403 }
      );
    }
  }

  const targetJobIds = query.job_id
    ? [new mongoose.Types.ObjectId(query.job_id)]
    : ownedJobIds;

  // Date filtering
  const dateFilter = {};
  if (query.from) {
    dateFilter.$gte = new Date(query.from);
  }
  if (query.to) {
    const toDate = new Date(query.to);
    // If date only string like 2026-10-09, set end of day
    if (query.to.length === 10) {
      toDate.setUTCHours(23, 59, 59, 999);
    }
    dateFilter.$lte = toDate;
  }
  const hasDateFilter = Object.keys(dateFilter).length > 0;

  // 2. Jobs Breakdown
  let relevantJobs = ownedJobs;
  if (query.job_id) {
    relevantJobs = ownedJobs.filter((j) => j._id.toString() === query.job_id.toString());
  }
  if (query.include_archived === "false") {
    relevantJobs = relevantJobs.filter((j) => j.status !== "archived");
  }

  const jobsSummary = {
    total_jobs: relevantJobs.length,
    published_jobs: relevantJobs.filter((j) => j.status === "published").length,
    archived_jobs: relevantJobs.filter((j) => j.status === "archived").length,
    draft_jobs: relevantJobs.filter((j) => j.status === "draft").length,
    closed_jobs: relevantJobs.filter((j) => j.status === "closed").length
  };

  if (targetJobIds.length === 0) {
    return {
      jobs: jobsSummary,
      applications: {
        total_applications: 0,
        shortlist_rate: 0,
        by_status: { applied: 0, pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 },
        by_job: [],
        trends: []
      },
      candidates: {
        total_candidates: 0,
        by_status: { applied: 0, pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 }
      },
      workflows: {
        total_workflows: 0,
        workflow_completion_rate: 0,
        by_status: { pending: 0, running: 0, waiting_approval: 0, completed: 0, failed: 0 }
      },
      agent_execution_metrics: [],
      candidate_count: 0,
      shortlist_rate: 0,
      workflow_completion_rate: 0
    };
  }

  // 3. Applications Breakdown
  const appMatch = {
    job_id: { $in: targetJobIds }
  };
  if (hasDateFilter) {
    appMatch.created_at = dateFilter;
  }

  const applicationStatusAgg = await Application.aggregate([
    { $match: appMatch },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const appStatusCounts = {
    applied: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0
  };
  let totalApplications = 0;
  for (const row of applicationStatusAgg) {
    if (appStatusCounts[row._id] !== undefined) {
      appStatusCounts[row._id] = row.count;
    }
    totalApplications += row.count;
  }

  const shortlistedCount = appStatusCounts.shortlisted || 0;
  const shortlistRate = totalApplications > 0
    ? Math.round((shortlistedCount / totalApplications) * 100)
    : 0;

  // Applications grouped by Job
  const appByJobAgg = await Application.aggregate([
    { $match: appMatch },
    {
      $group: {
        _id: "$job_id",
        total: { $sum: 1 },
        shortlisted: { $sum: { $cond: [{ $eq: ["$status", "shortlisted"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $in: ["$status", ["applied", "pending", "reviewed"]] }, 1, 0] } }
      }
    }
  ]);

  const jobMap = new Map();
  for (const j of ownedJobs) {
    jobMap.set(j._id.toString(), { title: j.title, status: j.status });
  }

  const applicationsByJob = appByJobAgg.map((item) => {
    const jobInfo = jobMap.get(item._id.toString()) || { title: "Unknown Job", status: "unknown" };
    return {
      job_id: item._id,
      title: jobInfo.title,
      job_status: jobInfo.status,
      total_applications: item.total,
      shortlisted: item.shortlisted,
      rejected: item.rejected,
      pending: item.pending
    };
  });

  // Application Trends over time (group by day)
  const appTrendsAgg = await Application.aggregate([
    { $match: appMatch },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const trends = appTrendsAgg.map((t) => ({
    date: t._id,
    applications: t.count
  }));

  // 4. Candidate Statistics
  const distinctCandidateIds = await Application.distinct("candidate_id", appMatch);
  const totalCandidates = distinctCandidateIds.length;

  const candidateStatusAgg = await Candidate.aggregate([
    { $match: { _id: { $in: distinctCandidateIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const candidateStatusCounts = {
    applied: 0,
    pending: 0,
    reviewed: 0,
    shortlisted: 0,
    rejected: 0
  };
  for (const row of candidateStatusAgg) {
    if (candidateStatusCounts[row._id] !== undefined) {
      candidateStatusCounts[row._id] = row.count;
    }
  }

  // 5. Workflows Metrics
  const wfMatch = {
    job_id: { $in: targetJobIds }
  };
  if (hasDateFilter) {
    wfMatch.created_at = dateFilter;
  }

  const workflowStatusAgg = await Workflow.aggregate([
    { $match: wfMatch },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const wfStatusCounts = {
    pending: 0,
    running: 0,
    waiting_approval: 0,
    completed: 0,
    failed: 0
  };
  let totalWorkflows = 0;
  for (const row of workflowStatusAgg) {
    if (wfStatusCounts[row._id] !== undefined) {
      wfStatusCounts[row._id] = row.count;
    }
    totalWorkflows += row.count;
  }

  const completedWorkflows = wfStatusCounts.completed || 0;
  const workflowCompletionRate = totalWorkflows > 0
    ? Math.round((completedWorkflows / totalWorkflows) * 100)
    : 0;

  // 6. Agent Execution Metrics from WorkflowLog
  const workflowsForRecruiter = await Workflow.find(wfMatch).select("_id");
  const workflowIds = workflowsForRecruiter.map((w) => w._id);

  let agentExecutionMetrics = [];
  if (workflowIds.length > 0) {
    const agentLogsAgg = await WorkflowLog.aggregate([
      { $match: { workflow_id: { $in: workflowIds } } },
      {
        $group: {
          _id: "$agent_name",
          executions: { $sum: 1 },
          success_count: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
          failed_count: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
        }
      },
      { $sort: { executions: -1 } }
    ]);
    agentExecutionMetrics = agentLogsAgg;
  }

  return {
    jobs: jobsSummary,
    applications: {
      total_applications: totalApplications,
      shortlist_rate: shortlistRate,
      by_status: appStatusCounts,
      by_job: applicationsByJob,
      trends
    },
    candidates: {
      total_candidates: totalCandidates,
      by_status: candidateStatusCounts
    },
    workflows: {
      total_workflows: totalWorkflows,
      workflow_completion_rate: workflowCompletionRate,
      by_status: wfStatusCounts
    },
    agent_execution_metrics: agentExecutionMetrics,
    // Spec compatibility keys for frontend
    candidate_count: totalCandidates,
    shortlist_rate: shortlistRate,
    workflow_completion_rate: workflowCompletionRate
  };
}

module.exports = { getRecruiterAnalytics };

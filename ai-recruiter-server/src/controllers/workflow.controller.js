const workflowService = require("../workflows/hiringWorkflow.service");
const { sendSuccess } = require("../utils/response");

async function startWorkflow(req, res) {
  const result = await workflowService.startWorkflow(req.body.candidate_id, req.body.job_id, req.user);
  return sendSuccess(res, result, 201);
}

async function retryWorkflow(req, res) {
  const result = await workflowService.retryWorkflow(req.body.workflow_id, req.user);
  return sendSuccess(res, result, 200);
}

async function approveWorkflow(req, res) {
  const result = await workflowService.approveWorkflow(req.body.workflow_id, req.body.approved, req.user);
  return sendSuccess(res, result, 200);
}

async function getWorkflow(req, res) {
  const result = await workflowService.getWorkflow(req.params.id, req.user);
  return sendSuccess(res, result, 200);
}

async function listWorkflows(req, res) {
  const result = await workflowService.listWorkflows(req.user);
  return sendSuccess(res, result, 200);
}

module.exports = { startWorkflow, retryWorkflow, approveWorkflow, getWorkflow, listWorkflows };

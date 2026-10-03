const workflowService = require("../workflows/hiringWorkflow.service");
const { sendSuccess } = require("../utils/response");

async function startWorkflow(req, res) {
  // TODO: Start the hiring workflow for the candidate and job in req.body, respond with 201.
  return res.status(501).json({ success: false, error: { message: "Start workflow is not implemented yet" } });
}

async function retryWorkflow(req, res) {
  // TODO: Retry the failed workflow in req.body.workflow_id.
  return res.status(501).json({ success: false, error: { message: "Retry workflow is not implemented yet" } });
}

async function approveWorkflow(req, res) {
  // TODO: Record the human approval decision and resume the workflow.
  return res.status(501).json({ success: false, error: { message: "Approve workflow is not implemented yet" } });
}

async function getWorkflow(req, res) {
  // TODO: Respond with the workflow, its logs, and the node state spec.
  return res.status(501).json({ success: false, error: { message: "Get workflow is not implemented yet" } });
}

async function listWorkflows(req, res) {
  // TODO: Respond with every workflow plus its logs and execution order.
  return res.status(501).json({ success: false, error: { message: "List workflows is not implemented yet" } });
}

module.exports = { startWorkflow, retryWorkflow, approveWorkflow, getWorkflow, listWorkflows };

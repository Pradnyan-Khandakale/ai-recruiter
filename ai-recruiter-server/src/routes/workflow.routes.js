const router = require("express").Router();
const controller = require("../controllers/workflow.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { startWorkflowSchema, retryWorkflowSchema, approveWorkflowSchema } = require("../validators/workflow.validators");

router.get("/", requireAuth, requireRole("recruiter"), asyncHandler(controller.listWorkflows));
router.post("/start", requireAuth, requireRole("recruiter"), validate(startWorkflowSchema), asyncHandler(controller.startWorkflow));
router.post("/retry", requireAuth, requireRole("recruiter"), validate(retryWorkflowSchema), asyncHandler(controller.retryWorkflow));
router.post("/approve", requireAuth, requireRole("recruiter"), validate(approveWorkflowSchema), asyncHandler(controller.approveWorkflow));
router.get("/:id", requireAuth, requireRole("recruiter"), asyncHandler(controller.getWorkflow));

module.exports = router;

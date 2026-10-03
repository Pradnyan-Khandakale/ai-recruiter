const router = require("express").Router();
const controller = require("../controllers/job.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { jobSchema } = require("../validators/job.validators");

router.get("/", asyncHandler(controller.listJobs));
router.get("/:id", asyncHandler(controller.getJob));
router.post("/", requireAuth, requireRole("recruiter"), validate(jobSchema), asyncHandler(controller.createJob));
router.put("/:id", requireAuth, requireRole("recruiter"), validate(jobSchema), asyncHandler(controller.updateJob));

module.exports = router;

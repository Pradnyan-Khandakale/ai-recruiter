const router = require("express").Router();
const controller = require("../controllers/job.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth.middleware");
const { jobSchema, jobUpdateSchema } = require("../validators/job.validators");

router.get("/", optionalAuth, asyncHandler(controller.listJobs));
router.get("/:id", optionalAuth, asyncHandler(controller.getJob));
router.post(
  "/",
  requireAuth,
  requireRole("recruiter"),
  validate(jobSchema),
  asyncHandler(controller.createJob)
);
router.put(
  "/:id",
  requireAuth,
  requireRole("recruiter"),
  validate(jobUpdateSchema),
  asyncHandler(controller.updateJob)
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("recruiter"),
  validate(jobUpdateSchema),
  asyncHandler(controller.updateJob)
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(controller.deleteJob)
);
router.get(
  "/:id/applications",
  requireAuth,
  requireRole("recruiter"),
  asyncHandler(controller.listJobApplications)
);

module.exports = router;

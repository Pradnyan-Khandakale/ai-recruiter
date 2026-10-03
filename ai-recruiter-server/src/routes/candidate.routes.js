const router = require("express").Router();
const controller = require("../controllers/candidate.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { resumeUpload } = require("../middleware/upload.middleware");
const { candidateUploadSchema } = require("../validators/candidate.validators");

router.post("/upload", resumeUpload.single("resume"), validate(candidateUploadSchema), asyncHandler(controller.uploadCandidate));
router.get("/", requireAuth, requireRole("recruiter"), asyncHandler(controller.listCandidates));
router.get("/:id", requireAuth, requireRole("recruiter"), asyncHandler(controller.getCandidate));

module.exports = router;

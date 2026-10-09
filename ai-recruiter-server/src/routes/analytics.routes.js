const router = require("express").Router();
const controller = require("../controllers/analytics.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const { analyticsQuerySchema } = require("../validators/analytics.validators");

router.get("/", requireAuth, requireRole("recruiter"), validate(analyticsQuerySchema, "query"), asyncHandler(controller.getAnalytics));

module.exports = router;

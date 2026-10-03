const router = require("express").Router();
const controller = require("../controllers/analytics.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

router.get("/", requireAuth, requireRole("recruiter"), asyncHandler(controller.getAnalytics));

module.exports = router;

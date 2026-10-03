const router = require("express").Router();

router.use("/auth", require("./auth.routes"));
router.use("/jobs", require("./job.routes"));
router.use("/candidates", require("./candidate.routes"));
router.use("/workflow", require("./workflow.routes"));
router.use("/analytics", require("./analytics.routes"));

module.exports = router;

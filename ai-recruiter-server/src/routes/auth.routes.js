const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const { asyncHandler } = require("../utils/asyncHandler");
const { validate } = require("../middleware/validate.middleware");
const { requireAuth } = require("../middleware/auth.middleware");
const { signupSchema, loginSchema } = require("../validators/auth.validators");

router.post("/signup", validate(signupSchema), asyncHandler(controller.signup));
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.get("/me", requireAuth, asyncHandler(controller.me));

module.exports = router;

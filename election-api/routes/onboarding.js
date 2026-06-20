const router = require("express").Router();
const { completeOnboarding, getOnboardingStatus } = require("../controllers/onboarding");
const { protect } = require("../middleware/auth");

router.post("/complete", protect, completeOnboarding);
router.get("/status", protect, getOnboardingStatus);

module.exports = router;

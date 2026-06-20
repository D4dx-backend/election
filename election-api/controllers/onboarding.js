const User = require("../model/User");

// @desc    Complete user onboarding
// @route   POST /api/v1/onboarding/complete
// @access  Private
exports.completeOnboarding = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { onboardingCompleted: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    res.status(200).json({
      success: true,
      data: { id: user._id, username: user.username, onboardingCompleted: true },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc    Get onboarding status
// @route   GET /api/v1/onboarding/status
// @access  Private
exports.getOnboardingStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("onboardingCompleted");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, data: { onboardingCompleted: user.onboardingCompleted } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

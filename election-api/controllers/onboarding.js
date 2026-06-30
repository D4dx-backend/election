const users = require("../lib/supabase/users");

exports.completeOnboarding = async (req, res) => {
  try {
    const user = await users.updateById(req.user._id, { onboardingCompleted: true });

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

exports.getOnboardingStatus = async (req, res) => {
  try {
    const user = await users.findById(req.user._id, { includePassword: false });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, data: { onboardingCompleted: user.onboardingCompleted } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

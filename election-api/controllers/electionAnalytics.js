const electionAnalytics = require("../lib/supabase/electionAnalytics");
const elections = require("../lib/supabase/elections");
const votes = require("../lib/supabase/votes");
const franchises = require("../lib/supabase/franchises");
const users = require("../lib/supabase/users");
const { sendVoteReminders: runSendVoteReminders } = require("../lib/reminders/sendVoteReminders");
const { logUserActivity } = require("../utils/auditLog");

exports.getDashboardStats = async (req, res) => {
  try {
    const role = req.user?.role;
    const franchiseId = req.user?.franchiseId;
    const scopeToFranchise = role === "franchise_admin" && franchiseId;

    const electionFilter = scopeToFranchise ? { franchiseId } : {};
    const electionList = await elections.findLean(electionFilter);
    const electionIds = electionList.map((e) => e._id);
    const totalElections = electionList.length;
    const activeElections = electionList.filter(
      (e) => e.status === "active" || e.votingOpen === true
    ).length;

    const voterFilter = { isVoter: true };
    if (scopeToFranchise) voterFilter.franchiseId = franchiseId;
    const totalVoters = await users.countDocuments(voterFilter);

    const voteFilter = scopeToFranchise ? { electionIds } : {};
    const votesCast = await votes.countDocuments(voteFilter);

    const totalFranchises =
      role === "super_admin"
        ? await franchises.countDocuments()
        : franchiseId
        ? 1
        : 0;

    let franchiseDistribution = [];
    if (role === "super_admin") {
      const franchiseList = await franchises.findLean();
      const countMap = await elections.countByFranchise();
      const total =
        Object.values(countMap).reduce((a, b) => a + b, 0) || 1;
      franchiseDistribution = franchiseList.map((f) => ({
        name: f.name,
        percentage: Math.round(((countMap[String(f._id)] || 0) / total) * 100),
      }));
    }

    const recentActivity = electionList
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((e) => ({
        action: `Election "${e.title || "Untitled"}" ${e.status || "created"}`,
        timestamp: e.createdAt ? new Date(e.createdAt).toLocaleString() : "",
        type:
          e.status === "active"
            ? "success"
            : e.status === "completed"
            ? "info"
            : "warning",
      }));

    return res.status(200).json({
      success: true,
      data: {
        activeElections,
        totalVoters,
        votesCast,
        totalFranchises,
        totalElections,
        franchiseDistribution,
        recentActivity,
      },
    });
  } catch (err) {
    console.error("Controller Error in getDashboardStats:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.sendVoteReminders = async (req, res) => {
  try {
    const { electionId } = req.params;
    const result = await runSendVoteReminders(electionId);

    await logUserActivity(
      req.user._id,
      req.ip,
      "Sent vote reminders",
      `${result.emailsSent} emails · ${result.pendingCount} pending`,
      "Election"
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    console.error("Controller Error in sendVoteReminders:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.addElectionAnalytics = async (req, res) => {
  try {
    const analytics = await electionAnalytics.create(req.body);
    res.status(201).json({ success: true, message: "Election analytics created.", analytics });
  } catch (err) {
    console.error("Controller Error in addElectionAnalytics:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getElectionAnalytics = async (req, res) => {
  try {
    const data = await electionAnalytics.findAll();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Controller Error in getElectionAnalytics:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getElectionAnalytic = async (req, res) => {
  try {
    const { id } = req.params;
    const analytic = await electionAnalytics.findById(id);
    if (!analytic) {
      return res.status(404).json({ success: false, message: "Election analytic not found." });
    }
    res.status(200).json({ success: true, data: analytic });
  } catch (err) {
    console.error("Controller Error in getElectionAnalytic:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateElectionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await electionAnalytics.updateById(id, req.body);
    if (!analytics) {
      return res.status(404).json({ success: false, message: "Election analytics not found." });
    }
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error("Controller Error in updateElectionAnalytics:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteElectionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await electionAnalytics.deleteById(id);
    if (!analytics) {
      return res.status(404).json({ success: false, message: "Election analytics not found." });
    }
    res.status(200).json({ success: true, message: "Election analytics deleted successfully." });
  } catch (err) {
    console.error("Controller Error in deleteElectionAnalytics:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

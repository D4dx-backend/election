const ElectionAnalytics = require("../model/ElectionAnalytics");
const Election = require("../model/Election");
const Vote = require("../model/Vote");
const Franchise = require("../model/Franchise");
const User = require("../model/User");

// @desc      GET DASHBOARD STATISTICS
// @route     GET /api/v1/electionAnalytics/dashboard
// @access    Protected
exports.getDashboardStats = async (req, res) => {
  try {
    const role = req.user?.role;
    const franchiseId = req.user?.franchiseId;
    const scopeToFranchise = role === "franchise_admin" && franchiseId;

    // Elections in scope
    const electionFilter = scopeToFranchise ? { franchiseId } : {};
    const elections = await Election.find(electionFilter)
      .select("_id status votingOpen title franchiseId createdAt")
      .lean();
    const electionIds = elections.map((e) => e._id);
    const totalElections = elections.length;
    const activeElections = elections.filter(
      (e) => e.status === "active" || e.votingOpen === true
    ).length;

    // Voters in scope
    const voterFilter = { isVoter: true };
    if (scopeToFranchise) voterFilter.franchiseId = franchiseId;
    const totalVoters = await User.countDocuments(voterFilter);

    // Votes cast in scope
    const voteFilter = scopeToFranchise ? { electionId: { $in: electionIds } } : {};
    const votesCast = await Vote.countDocuments(voteFilter);

    // Total franchises
    const totalFranchises =
      role === "super_admin"
        ? await Franchise.countDocuments()
        : franchiseId
        ? 1
        : 0;

    // Franchise distribution (by number of elections) — super admin only
    let franchiseDistribution = [];
    if (role === "super_admin") {
      const franchises = await Franchise.find().select("_id name").lean();
      const counts = await Election.aggregate([
        { $group: { _id: "$franchiseId", count: { $sum: 1 } } },
      ]);
      const countMap = {};
      counts.forEach((c) => {
        if (c._id) countMap[c._id.toString()] = c.count;
      });
      const total =
        Object.values(countMap).reduce((a, b) => a + b, 0) || 1;
      franchiseDistribution = franchises.map((f) => ({
        name: f.name,
        percentage: Math.round(((countMap[f._id.toString()] || 0) / total) * 100),
      }));
    }

    // Recent activity from the most recently created elections in scope
    const recentActivity = elections
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


// @desc      ADD ELECTION ANALYTICS
// @route     POST /api/v1/election-analytics
// @access    Protected
exports.addElectionAnalytics = async (req, res) => {
  try {
    console.log("Controller: Attempting to add election analytics:", req.body);
    const analytics = await ElectionAnalytics.create(req.body);
    console.log("Controller: Election analytics created successfully:", analytics);
    res.status(201).json({ success: true, message: 'Election analytics created.', analytics });
  } catch (err) {
    console.error("Controller Error in addElectionAnalytics:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET ALL ELECTION ANALYTICS
// @route     GET /api/v1/election-analytics
// @access    Protected
exports.getElectionAnalytics = async (req, res) => {
  try {
    console.log("Controller: Attempting to get all election analytics");
    const analytics = await ElectionAnalytics.find();
    console.log("Controller: Retrieved all election analytics, count:", analytics.length);
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error("Controller Error in getElectionAnalytics:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET SINGLE ELECTION ANALYTICS
// @route     GET /api/v1/election-analytics/:id
// @access    Protected
exports.getElectionAnalytic = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Controller: Attempting to get election analytic with ID: ${id}`);
    const analytic = await ElectionAnalytics.findById(id);
    if (!analytic) {
      console.log(`Controller: Election analytic with ID: ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Election analytic not found.' });
    }
    console.log("Controller: Retrieved single election analytic:", analytic);
    res.status(200).json({ success: true, data: analytic });
  } catch (err) {
    console.error("Controller Error in getElectionAnalytic:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE ELECTION ANALYTICS
// @route     PUT /api/v1/election-analytics/:id
// @access    Protected
exports.updateElectionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Controller: Attempting to update election analytics with ID: ${id}`, req.body);
    const analytics = await ElectionAnalytics.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!analytics) {
      console.log(`Controller: Election analytics with ID: ${id} not found for update.`);
      return res.status(404).json({ success: false, message: 'Election analytics not found.' });
    }
    console.log("Controller: Election analytics updated successfully:", analytics);
    res.status(200).json({ success: true, data: analytics });
  } catch (err) {
    console.error("Controller Error in updateElectionAnalytics:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE ELECTION ANALYTICS
// @route     DELETE /api/v1/election-analytics/:id
// @access    Protected
exports.deleteElectionAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Controller: Attempting to delete election analytics with ID: ${id}`);
    const analytics = await ElectionAnalytics.findByIdAndDelete(id);
    if (!analytics) {
      console.log(`Controller: Election analytics with ID: ${id} not found for deletion.`);
      return res.status(404).json({ success: false, message: 'Election analytics not found.' });
    }
    console.log("Controller: Election analytics deleted successfully:", analytics);
    res.status(200).json({ success: true, message: 'Election analytics deleted successfully.' });
  } catch (err) {
    console.error("Controller Error in deleteElectionAnalytics:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

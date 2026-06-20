const ElectionAnalytics = require("../model/ElectionAnalytics");

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

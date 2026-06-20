const ElectionGroup = require("../model/ElectionGroup");

// @desc      ADD ELECTION GROUP
// @route     POST /api/v1/election-groups
// @access    public
exports.addElectionGroup = async (req, res) => {
  try {
    const electionGroup = await ElectionGroup.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", electionGroup.name, "Election Group");
    res.status(201).json({ success: true, message: 'Election Group created.', electionGroup });
  } catch (err) {
    console.error(err);
    errorLog(req, err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Implement other CRUD operations similarly...

exports.getElectionGroupById = async (req, res) => {
  try {
    const eg = await ElectionGroup.findById(req.params.id);
    if (!eg) return res.status(404).json({ success: false, message: 'Election Group not found.' });
    res.status(200).json({ success: true, data: eg });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.updateElectionGroupById = async (req, res) => {
  try {
    const eg = await ElectionGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!eg) return res.status(404).json({ success: false, message: 'Election Group not found.' });
    res.status(200).json({ success: true, data: eg });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.deleteElectionGroupById = async (req, res) => {
  try {
    const eg = await ElectionGroup.findByIdAndDelete(req.params.id);
    if (!eg) return res.status(404).json({ success: false, message: 'Election Group not found.' });
    res.status(200).json({ success: true, message: 'Election Group deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

// @desc      GET ALL ELECTION GROUPS
// @route     GET /api/v1/electionGroup
// @access    Protected
exports.getElectionGroups = async (req, res) => {
  try {
    const electionGroups = await ElectionGroup.find();
    res.status(200).json({ success: true, count: electionGroups.length, data: electionGroups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE ELECTION GROUP
// @route     PUT /api/v1/electionGroup
// @access    Protected
exports.updateElectionGroup = async (req, res) => {
  try {
    const { id } = req.body;
    const electionGroup = await ElectionGroup.findByIdAndUpdate(id, req.body, { new: true });
    if (!electionGroup) {
      return res.status(404).json({ success: false, message: 'Election Group not found.' });
    }
    res.status(200).json({ success: true, data: electionGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE ELECTION GROUP
// @route     DELETE /api/v1/electionGroup
// @access    Protected
exports.deleteElectionGroup = async (req, res) => {
  try {
    const { id } = req.query;
    const electionGroup = await ElectionGroup.findByIdAndDelete(id);
    if (!electionGroup) {
      return res.status(404).json({ success: false, message: 'Election Group not found.' });
    }
    res.status(200).json({ success: true, message: 'Election Group deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

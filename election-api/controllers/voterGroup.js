const VoterGroup = require("../model/VoterGroup");

// @desc      ADD VOTER GROUP
// @route     POST /api/v1/voter-groups
// @access    public
exports.addVoterGroup = async (req, res) => {
  try {
    const voterGroup = await VoterGroup.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", voterGroup.name, "Voter Group");
    res.status(201).json({ success: true, message: 'Voter Group created.', voterGroup });
  } catch (err) {
    console.error(err);
    errorLog(req, err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Implement other CRUD operations similarly...

exports.getVoterGroupById = async (req, res) => {
  try {
    const vg = await VoterGroup.findById(req.params.id);
    if (!vg) return res.status(404).json({ success: false, message: 'Voter Group not found.' });
    res.status(200).json({ success: true, data: vg });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.updateVoterGroupById = async (req, res) => {
  try {
    const vg = await VoterGroup.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vg) return res.status(404).json({ success: false, message: 'Voter Group not found.' });
    res.status(200).json({ success: true, data: vg });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.deleteVoterGroupById = async (req, res) => {
  try {
    const vg = await VoterGroup.findByIdAndDelete(req.params.id);
    if (!vg) return res.status(404).json({ success: false, message: 'Voter Group not found.' });
    res.status(200).json({ success: true, message: 'Voter Group deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

// @desc      GET ALL VOTER GROUPS
// @route     GET /api/v1/voterGroup
// @access    Protected
exports.getVoterGroups = async (req, res) => {
  try {
    const voterGroups = await VoterGroup.find();
    res.status(200).json({ success: true, count: voterGroups.length, data: voterGroups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE VOTER GROUP
// @route     PUT /api/v1/voterGroup
// @access    Protected
exports.updateVoterGroup = async (req, res) => {
  try {
    const { id } = req.body;
    const voterGroup = await VoterGroup.findByIdAndUpdate(id, req.body, { new: true });
    if (!voterGroup) {
      return res.status(404).json({ success: false, message: 'Voter Group not found.' });
    }
    res.status(200).json({ success: true, data: voterGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE VOTER GROUP
// @route     DELETE /api/v1/voterGroup
// @access    Protected
exports.deleteVoterGroup = async (req, res) => {
  try {
    const { id } = req.query;
    const voterGroup = await VoterGroup.findByIdAndDelete(id);
    if (!voterGroup) {
      return res.status(404).json({ success: false, message: 'Voter Group not found.' });
    }
    res.status(200).json({ success: true, message: 'Voter Group deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

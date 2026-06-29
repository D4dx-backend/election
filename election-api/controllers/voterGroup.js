const voterGroups = require("../lib/supabase/voterGroups");
const { logUserActivity } = require("../utils/auditLog");

exports.addVoterGroup = async (req, res) => {
  try {
    const voterGroup = await voterGroups.create(req.body);
    await voterGroups.syncGroupVotersAccess(voterGroup);
    await logUserActivity(req.user._id, req.ip, "Created", voterGroup.name, "Voter Group");
    res.status(201).json({ success: true, message: "Voter Group created.", voterGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getVoterGroupById = async (req, res) => {
  try {
    const vg = await voterGroups.findById(req.params.id, {
      populateElections: true,
      populateVoters: true,
    });
    if (!vg) return res.status(404).json({ success: false, message: "Voter Group not found." });
    res.status(200).json({ success: true, data: vg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateVoterGroupById = async (req, res) => {
  try {
    const vg = await voterGroups.updateById(req.params.id, req.body);
    if (!vg) return res.status(404).json({ success: false, message: "Voter Group not found." });
    await voterGroups.syncGroupVotersAccess(vg);
    res.status(200).json({ success: true, data: vg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.addVotersToGroup = async (req, res) => {
  try {
    const { voterIds } = req.body;
    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return res.status(400).json({ success: false, message: "voterIds must be a non-empty array." });
    }
    const vg = await voterGroups.addVotersToGroup(req.params.id, voterIds);
    if (!vg) return res.status(404).json({ success: false, message: "Voter Group not found." });
    await logUserActivity(req.user._id, req.ip, "Added voters to", vg.name, "Voter Group");
    res.status(200).json({ success: true, data: vg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.removeVotersFromGroup = async (req, res) => {
  try {
    const { voterIds } = req.body;
    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return res.status(400).json({ success: false, message: "voterIds must be a non-empty array." });
    }
    const vg = await voterGroups.removeVotersFromGroup(req.params.id, voterIds);
    if (!vg) return res.status(404).json({ success: false, message: "Voter Group not found." });
    await logUserActivity(req.user._id, req.ip, "Removed voters from", vg.name, "Voter Group");
    res.status(200).json({ success: true, data: vg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteVoterGroupById = async (req, res) => {
  try {
    const vg = await voterGroups.deleteById(req.params.id);
    if (!vg) return res.status(404).json({ success: false, message: "Voter Group not found." });
    res.status(200).json({ success: true, message: "Voter Group deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getVoterGroups = async (req, res) => {
  try {
    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const { groups: paged, total } = await voterGroups.findAll({ page, limit, populateElections: true });
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      return res.status(200).json({
        success: true,
        count: paged.length,
        pagination: { total, page, pageSize: limit, totalPages },
        data: paged,
      });
    }

    const { groups: voterGroupsList } = await voterGroups.findAll({ populateElections: true });
    res.status(200).json({ success: true, count: voterGroupsList.length, data: voterGroupsList });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateVoterGroup = async (req, res) => {
  try {
    const { id } = req.body;
    const voterGroup = await voterGroups.updateById(id, req.body);
    if (!voterGroup) {
      return res.status(404).json({ success: false, message: "Voter Group not found." });
    }
    res.status(200).json({ success: true, data: voterGroup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteVoterGroup = async (req, res) => {
  try {
    const { id } = req.query;
    const voterGroup = await voterGroups.deleteById(id);
    if (!voterGroup) {
      return res.status(404).json({ success: false, message: "Voter Group not found." });
    }
    res.status(200).json({ success: true, message: "Voter Group deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

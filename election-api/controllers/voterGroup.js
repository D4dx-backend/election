const VoterGroup = require("../model/VoterGroup");
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const { logUserActivity } = require("../utils/auditLog");

function generateRandomPassword(length = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

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
    // Opt-in server-side pagination (only when ?page is provided)
    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const total = await VoterGroup.countDocuments();
      const paged = await VoterGroup.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      return res.status(200).json({
        success: true,
        count: paged.length,
        pagination: { total, page, pageSize: limit, totalPages },
        data: paged,
      });
    }

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

// @desc      ASSIGN ELECTIONS TO A VOTER GROUP
// @route     PUT /api/v1/voterGroup/:id/elections
// @access    Protected
exports.assignElections = async (req, res) => {
  try {
    const { electionIds } = req.body;
    const group = await VoterGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Voter Group not found.' });

    group.electionIds = electionIds || [];
    await group.save();

    // Update electionAccess on all voters in this group
    if (group.voters && group.voters.length > 0) {
      await User.updateMany(
        { _id: { $in: group.voters } },
        { $set: { electionAccess: group.electionIds } }
      );
    }

    res.status(200).json({ success: true, data: group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET VOTERS IN A GROUP
// @route     GET /api/v1/voterGroup/:id/voters
// @access    Protected
exports.getGroupVoters = async (req, res) => {
  try {
    const group = await VoterGroup.findById(req.params.id).populate({
      path: 'voters',
      select: '-password',
    });
    if (!group) return res.status(404).json({ success: false, message: 'Voter Group not found.' });
    res.status(200).json({ success: true, count: group.voters.length, data: group.voters });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      CREATE SINGLE VOTER IN A GROUP
// @route     POST /api/v1/voterGroup/:id/voter
// @access    Protected
exports.addVoterToGroup = async (req, res) => {
  try {
    const group = await VoterGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Voter Group not found.' });

    const { username, fullName, registrationNumber } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'username is required.' });

    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ success: false, message: 'Username already exists.' });

    const plainPassword = generateRandomPassword(8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const franchiseId = req.user && req.user.franchiseId;

    const voter = await User.create({
      username,
      password: hashedPassword,
      plainPassword,
      fullName: fullName || username,
      registrationNumber: registrationNumber || username,
      role: 'voter',
      isVoter: true,
      status: 'active',
      franchiseId,
      electionAccess: group.electionIds || [],
      voterGroupId: group._id,
    });

    group.voters.push(voter._id);
    await group.save();

    res.status(201).json({ success: true, data: { id: voter._id, username: voter.username, plainPassword } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      ADD EXISTING USERS TO A GROUP
// @route     POST /api/v1/voterGroup/:id/add-users
// @access    Protected
exports.addExistingUsersToGroup = async (req, res) => {
  try {
    const group = await VoterGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Voter Group not found.' });

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds array is required.' });
    }

    const existingIds = new Set(group.voters.map(id => id.toString()));
    const newIds = userIds.filter(id => !existingIds.has(id.toString()));

    if (newIds.length > 0) {
      group.voters.push(...newIds);
      await group.save();
      const updateFields = { voterGroupId: group._id };
      if (group.electionIds && group.electionIds.length > 0) {
        updateFields.electionAccess = group.electionIds;
      }
      await User.updateMany({ _id: { $in: newIds } }, { $set: updateFields });
    }

    res.status(200).json({ success: true, data: { added: newIds.length, skipped: userIds.length - newIds.length } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      BULK GENERATE VOTERS IN A GROUP
// @route     POST /api/v1/voterGroup/:id/generate
// @access    Protected
exports.generateVotersInGroup = async (req, res) => {
  try {
    const group = await VoterGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Voter Group not found.' });

    const prefix = req.body.prefix || group.prefix || 'VOTE';
    const start = parseInt(req.body.startingNumber, 10) || group.startingNumber || 1001;
    const num = Math.min(parseInt(req.body.count, 10) || 10, 1000);
    const franchiseId = req.body.franchiseId || (req.user && req.user.franchiseId);
    const electionAccess = group.electionIds || [];

    // Build username list & skip existing
    const usernames = [];
    for (let i = 0; i < num; i++) usernames.push(`${prefix}${start + i}`);
    const existing = await User.find({ username: { $in: usernames } }).select('username');
    const existingSet = new Set(existing.map(u => u.username));

    const docs = [];
    for (let i = 0; i < num; i++) {
      const seq = start + i;
      const username = `${prefix}${seq}`;
      if (existingSet.has(username)) continue;
      const plainPassword = generateRandomPassword(8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      docs.push({
        username,
        password: hashedPassword,
        plainPassword,
        fullName: username,
        role: 'voter',
        isVoter: true,
        status: 'active',
        registrationNumber: username,
        franchiseId,
        electionAccess,
        voterGroupId: group._id,
        voterMetadata: { prefix, sequenceNumber: seq, electionGroups: [] },
      });
    }

    if (docs.length === 0) {
      return res.status(409).json({ success: false, message: 'All requested usernames already exist.' });
    }

    const created = await User.insertMany(docs, { ordered: false });

    // Add new voter IDs to group
    const newIds = created.map(u => u._id);
    await VoterGroup.findByIdAndUpdate(group._id, { $push: { voters: { $each: newIds } } });

    res.status(201).json({
      success: true,
      count: created.length,
      skipped: num - created.length,
      data: created.map(u => ({ id: u._id, username: u.username, plainPassword: u.plainPassword })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

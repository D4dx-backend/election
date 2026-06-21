const User = require("../model/User");
const bcrypt = require("bcryptjs");
const { logUserActivity } = require("../utils/auditLog");

// @desc      ADD USER
// @route     POST /api/v1/users
// @access    public
exports.addUser = async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists.' });
    }
    const user = await User.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", user.username, "User");
    res.status(201).json({ success: true, message: 'User created.', user });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET ALL USERS
// @route     GET /api/v1/users
// @access    public
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE USER
// @route     PUT /api/v1/users
// @access    public
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.body;
    const user = await User.findByIdAndUpdate(id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    await logUserActivity(req.user._id, req.ip, "Updated", user.username, "User");
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE USER
// @route     DELETE /api/v1/users
// @access    public
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    await logUserActivity(req.user._id, req.ip, "Deleted", user.username, "User");
    res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Implement other CRUD operations similarly...

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, data: user });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getFranchiseAdmins = async (req, res) => {
  try {
    const filter = { role: "franchise_admin" };
    if (req.query.franchiseId) filter.franchiseId = req.query.franchiseId;
    const users = await User.find(filter).select("-password");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getElectionAdmins = async (req, res) => {
  try {
    const users = await User.find({ role: "election_admin" }).select("-password");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getAllVoters = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const query = { isVoter: true };
    if (req.query.status) query.status = req.query.status;
    if (req.query.electionId && req.query.electionId !== "all") {
      query.electionAccess = { $in: [req.query.electionId] };
    }
    const total = await User.countDocuments(query);
    const voters = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.status(200).json({ success: true, pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) }, data: voters });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

// @desc      CREATE SINGLE VOTER
// @route     POST /api/v1/user/voters
// @access    protected
exports.createVoter = async (req, res) => {
  try {
    const { username, password, fullName, registrationNumber, electionIds } = req.body;
    if (!username || typeof username !== "string") {
      return res.status(400).json({ success: false, message: "username is required." });
    }
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ success: false, message: "Username already exists." });
    }
    const plainPassword = password && String(password).trim() ? String(password) : `vote${Date.now().toString().slice(-4)}`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const franchiseId = req.body.franchiseId || (req.user && req.user.franchiseId) || undefined;
    const electionAccess = Array.isArray(electionIds) ? electionIds : (electionIds ? [electionIds] : []);
    const user = await User.create({
      username,
      password: hashedPassword,
      fullName: fullName || username,
      role: "voter",
      isVoter: true,
      status: "active",
      registrationNumber: registrationNumber || username,
      franchiseId,
      electionAccess,
    });
    await logUserActivity(req.user._id, req.ip, "Created", user.username, "Voter");
    res.status(201).json({
      success: true,
      message: "Voter created.",
      data: { id: user._id, username: user.username, password: plainPassword },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.generateVoters = async (req, res) => {
  try {
    const {
      prefix,
      startingNumber,
      count,
      electionIds,
      electionGroupId,
      voterGroupId,
      assignmentType,
    } = req.body;

    if (!prefix || typeof prefix !== "string") {
      return res.status(400).json({ success: false, message: "prefix is required." });
    }
    const start = parseInt(startingNumber, 10);
    const num = parseInt(count, 10);
    if (Number.isNaN(start) || start < 0) {
      return res.status(400).json({ success: false, message: "startingNumber must be a non-negative number." });
    }
    if (Number.isNaN(num) || num < 1 || num > 1000) {
      return res.status(400).json({ success: false, message: "count must be between 1 and 1000." });
    }

    const electionAccess =
      assignmentType === "election" && Array.isArray(electionIds) ? electionIds : [];
    const electionGroups =
      assignmentType === "electionGroup" && electionGroupId ? [electionGroupId] : [];

    // Build the list of usernames we intend to create
    const usernames = [];
    for (let i = 0; i < num; i++) usernames.push(`${prefix}${start + i}`);

    // Skip usernames that already exist to avoid unique-index collisions
    const existing = await User.find({ username: { $in: usernames } }).select("username");
    const existingSet = new Set(existing.map((u) => u.username));

    const franchiseId = req.body.franchiseId || (req.user && req.user.franchiseId) || undefined;

    const docs = [];
    for (let i = 0; i < num; i++) {
      const seq = start + i;
      const username = `${prefix}${seq}`;
      if (existingSet.has(username)) continue;
      const plainPassword = `${prefix.toLowerCase()}${seq}`;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      docs.push({
        username,
        password: hashedPassword,
        fullName: username,
        role: "voter",
        isVoter: true,
        status: "active",
        registrationNumber: username,
        franchiseId,
        electionAccess,
        voterMetadata: {
          prefix,
          sequenceNumber: seq,
          electionGroups,
        },
        ...(voterGroupId ? { voterGroupId } : {}),
      });
    }

    if (docs.length === 0) {
      return res.status(409).json({
        success: false,
        message: "All requested voter usernames already exist.",
      });
    }

    const created = await User.insertMany(docs, { ordered: false });
    res.status(201).json({
      success: true,
      message: `Generated ${created.length} voter accounts.`,
      count: created.length,
      skipped: num - created.length,
      data: created.map((u) => ({ id: u._id, username: u.username })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.createFranchiseAdmin = async (req, res) => {
  try {
    const { username, password, fullName, franchiseId } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ success: false, message: "Username already exists." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, fullName, franchiseId, role: "franchise_admin" });
    res.status(201).json({ success: true, message: "Franchise admin created.", data: { id: user._id, username: user.username, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.createElectionAdmin = async (req, res) => {
  try {
    const { username, password, fullName, franchiseId, electionAccess } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(409).json({ success: false, message: "Username already exists." });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword, fullName, franchiseId, electionAccess, role: "election_admin" });
    res.status(201).json({ success: true, message: "Election admin created.", data: { id: user._id, username: user.username, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ success: false, message: "newPassword is required." });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findByIdAndUpdate(req.params.id, { password: hashedPassword }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, message: "Password reset successfully." });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

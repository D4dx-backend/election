const User = require("../model/User");
const bcrypt = require("bcryptjs");

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
    const users = await User.find({ role: "franchise_admin" }).select("-password");
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

exports.createFranchiseAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ username: req.body.username });
    if (existing) return res.status(409).json({ success: false, message: "Username already exists." });
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword, role: "franchise_admin" });
    res.status(201).json({ success: true, message: "Franchise admin created.", data: { id: user._id, username: user.username, role: user.role } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.createElectionAdmin = async (req, res) => {
  try {
    const existing = await User.findOne({ username: req.body.username });
    if (existing) return res.status(409).json({ success: false, message: "Username already exists." });
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({ ...req.body, password: hashedPassword, role: "election_admin" });
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

const Vote = require("../model/Vote");
const Election = require("../model/Election");
const Nominee = require("../model/Nominee");
const User = require("../model/User");

// @desc      ADD VOTE
// @route     POST /api/v1/votes
// @access    public
exports.addVote = async (req, res) => {
  try {
    const vote = await Vote.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Voted", vote.electionId, "Vote");
    res.status(201).json({ success: true, message: 'Vote recorded.', vote });
  } catch (err) {
    console.error(err);
    errorLog(req, err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Implement other CRUD operations similarly...

exports.getAvailableElections = async (req, res) => {
  try {
    const voter = await User.findById(req.user._id);
    if (!voter || !voter.electionAccess || voter.electionAccess.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }
    const elections = await Election.find({
      _id: { $in: voter.electionAccess },
      votingOpen: true,
    }).populate("franchiseId", "name logo");
    res.status(200).json({ success: true, count: elections.length, data: elections });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.checkVoterStatus = async (req, res) => {
  try {
    const votes = await Vote.find({ voterId: req.user._id });
    const votingStatus = {};
    votes.forEach(v => { votingStatus[v.electionId.toString()] = "voted"; });
    res.status(200).json({ success: true, data: votingStatus });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getMyVote = async (req, res) => {
  try {
    const vote = await Vote.findOne({ voterId: req.user._id, electionId: req.params.electionId })
      .populate("nominees", "name photo");
    if (!vote) return res.status(404).json({ success: false, message: "No vote found for this election." });
    res.status(200).json({ success: true, data: vote });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.castVote = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { nomineeIds } = req.body;

    if (!nomineeIds || !Array.isArray(nomineeIds) || nomineeIds.length === 0) {
      return res.status(400).json({ success: false, message: "nomineeIds array is required." });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!election.votingOpen) return res.status(400).json({ success: false, message: "Election is not open for voting." });

    const voter = await User.findById(req.user._id);
    if (!voter || !voter.electionAccess || !voter.electionAccess.some(id => id.toString() === electionId)) {
      return res.status(403).json({ success: false, message: "Voter does not have access to this election." });
    }

    const existing = await Vote.findOne({ voterId: req.user._id, electionId });
    if (existing) return res.status(400).json({ success: false, message: "Already voted in this election." });

    if (nomineeIds.length > election.numberToBeElected) {
      return res.status(400).json({ success: false, message: `Maximum nominees to select: ${election.numberToBeElected}` });
    }

    const vote = await Vote.create({
      electionId,
      voterId: req.user._id,
      nominees: nomineeIds,
      ipAddress: req.ip,
      status: "completed",
    });
    res.status(201).json({ success: true, message: "Vote cast successfully.", data: vote });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};
// @route     GET /api/v1/vote
// @access    Protected
exports.getVotes = async (req, res) => {
  try {
    const votes = await Vote.find();
    res.status(200).json({ success: true, count: votes.length, data: votes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE VOTE
// @route     PUT /api/v1/vote
// @access    Protected
exports.updateVote = async (req, res) => {
  try {
    const { id } = req.body;
    const vote = await Vote.findByIdAndUpdate(id, req.body, { new: true });
    if (!vote) {
      return res.status(404).json({ success: false, message: 'Vote not found.' });
    }
    res.status(200).json({ success: true, data: vote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE VOTE
// @route     DELETE /api/v1/vote
// @access    Protected
exports.deleteVote = async (req, res) => {
  try {
    const { id } = req.query;
    const vote = await Vote.findByIdAndDelete(id);
    if (!vote) {
      return res.status(404).json({ success: false, message: 'Vote not found.' });
    }
    res.status(200).json({ success: true, message: 'Vote deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

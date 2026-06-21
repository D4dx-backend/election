const Vote = require("../model/Vote");
const Election = require("../model/Election");
const Nominee = require("../model/Nominee");
const { logUserActivity } = require("../utils/auditLog");
const User = require("../model/User");
const mongoose = require("mongoose");

// @desc      GET ELECTION RESULTS (vote tally per nominee)
// @route     GET /api/v1/vote/results/:electionId
// @access    protected
exports.getElectionResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId).lean();
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    // Voters may only see results once an admin has published them.
    const role = req.user && req.user.role;
    const isVoter = !role || role === "voter";
    if (isVoter && !election.resultsPublished) {
      return res.status(403).json({ success: false, message: "Results have not been published yet." });
    }

    const totalBallots = await Vote.countDocuments({ electionId });

    const tally = await Vote.aggregate([
      { $match: { electionId: new mongoose.Types.ObjectId(electionId) } },
      { $unwind: "$nominees" },
      { $group: { _id: "$nominees", voteCount: { $sum: 1 } } },
    ]);
    const tallyMap = {};
    tally.forEach((t) => { tallyMap[t._id.toString()] = t.voteCount; });

    const nominees = await Nominee.find({ electionId }).lean();
    const results = nominees
      .map((n) => {
        const voteCount = tallyMap[n._id.toString()] || 0;
        return {
          _id: n._id,
          id: n._id,
          name: n.name,
          gender: n.gender,
          electionId: n.electionId,
          voteCount,
          percentage: totalBallots > 0 ? (voteCount / totalBallots) * 100 : 0,
        };
      })
      .sort((a, b) => b.voteCount - a.voteCount);

    // Voters only see the level of detail the admin configured. Admins always
    // get the full breakdown. Strip server-side so hidden numbers never leak.
    const displayMode = election.voterResultDisplay || "full";
    const showScore = !isVoter || displayMode === "score" || displayMode === "full";
    const showPercentage = !isVoter || displayMode === "percentage" || displayMode === "full";
    const visibleResults = results.map((r) => ({
      ...r,
      voteCount: showScore ? r.voteCount : undefined,
      percentage: showPercentage ? r.percentage : undefined,
    }));

    const eligibleVoters = await User.countDocuments({ isVoter: true, electionAccess: electionId });

    return res.status(200).json({
      success: true,
      data: {
        election: {
          _id: election._id,
          title: election.title,
          organization: election.organization,
          numberToBeElected: election.numberToBeElected,
          electionDate: election.electionDate,
          createdAt: election.createdAt,
          resultsPublished: !!election.resultsPublished,
          resultsPublishedAt: election.resultsPublishedAt || null,
          genderBasedSelection: !!election.genderBasedSelection,
          maleMinimum: election.maleMinimum || 0,
          femaleMinimum: election.femaleMinimum || 0,
          voterResultDisplay: displayMode,
        },
        totalBallots: isVoter && !showScore ? undefined : totalBallots,
        eligibleVoters,
        turnout: eligibleVoters > 0 ? Math.round((totalBallots / eligibleVoters) * 100) : 0,
        nominees: visibleResults,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

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

    // Deduplicate so a voter can't repeat the same nominee to inflate the tally.
    const uniqueNomineeIds = [...new Set(nomineeIds.map((id) => String(id)))];
    if (uniqueNomineeIds.length > election.numberToBeElected) {
      return res.status(400).json({ success: false, message: `Maximum nominees to select: ${election.numberToBeElected}` });
    }

    // Every selected nominee must actually belong to this election.
    const selectedNominees = await Nominee.find({
      _id: { $in: uniqueNomineeIds },
      electionId,
    });
    if (selectedNominees.length !== uniqueNomineeIds.length) {
      return res.status(400).json({ success: false, message: "One or more selected nominees are invalid for this election." });
    }

    // Enforce gender minimums only when the election uses gender-based selection.
    if (election.genderBasedSelection) {
      const maleCount = selectedNominees.filter((n) => n.gender !== "female").length;
      const femaleCount = selectedNominees.filter((n) => n.gender === "female").length;
      if ((election.maleMinimum || 0) > 0 && maleCount < election.maleMinimum) {
        return res.status(400).json({ success: false, message: `Select at least ${election.maleMinimum} male nominee(s).` });
      }
      if ((election.femaleMinimum || 0) > 0 && femaleCount < election.femaleMinimum) {
        return res.status(400).json({ success: false, message: `Select at least ${election.femaleMinimum} female nominee(s).` });
      }
    }

    const existing = await Vote.findOne({ voterId: req.user._id, electionId });
    if (existing) return res.status(400).json({ success: false, message: "Already voted in this election." });

    let vote;
    try {
      vote = await Vote.create({
        electionId,
        voterId: req.user._id,
        nominees: uniqueNomineeIds,
        ipAddress: req.ip,
        status: "completed",
      });
    } catch (createErr) {
      // Unique index {electionId, voterId} → a concurrent request already voted.
      if (createErr && createErr.code === 11000) {
        return res.status(400).json({ success: false, message: "Already voted in this election." });
      }
      throw createErr;
    }
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

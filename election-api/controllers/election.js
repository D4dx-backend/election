const Election = require("../model/Election");

// @desc      ADD ELECTION
// @route     POST /api/v1/elections
// @access    public
exports.addElection = async (req, res) => {
  try {
    const election = await Election.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", election.title, "Election");
    res.status(201).json({ success: true, message: 'Election created.', election });
  } catch (err) {
    console.error(err);
    errorLog(req, err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Implement other CRUD operations similarly...

exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });
    res.status(200).json({ success: true, data: election });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.updateElectionById = async (req, res) => {
  try {
    const election = await Election.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });
    res.status(200).json({ success: true, data: election });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.deleteElectionById = async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });
    res.status(200).json({ success: true, message: 'Election deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find();
    res.status(200).json({ success: true, count: elections.length, data: elections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE ELECTION
// @route     PUT /api/v1/election
// @access    Protected
exports.updateElection = async (req, res) => {
  try {
    const { id } = req.body;
    const election = await Election.findByIdAndUpdate(id, req.body, { new: true });
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found.' });
    }
    res.status(200).json({ success: true, data: election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE ELECTION
// @route     DELETE /api/v1/election
// @access    Protected
exports.deleteElection = async (req, res) => {
  try {
    const { id } = req.query;
    const election = await Election.findByIdAndDelete(id);
    if (!election) {
      return res.status(404).json({ success: false, message: 'Election not found.' });
    }
    res.status(200).json({ success: true, message: 'Election deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

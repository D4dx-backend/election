const Nominee = require("../model/Nominee");

// @desc      ADD NOMINEE
// @route     POST /api/v1/nominees
// @access    public
exports.addNominee = async (req, res) => {
  try {
    const nominee = await Nominee.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", nominee.name, "Nominee");
    res.status(201).json({ success: true, message: 'Nominee created.', nominee });
  } catch (err) {
    console.error(err);
    errorLog(req, err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Implement other CRUD operations similarly...

exports.getNomineesByElection = async (req, res) => {
  try {
    const nominees = await Nominee.find({ electionId: req.params.electionId });
    res.status(200).json({ success: true, count: nominees.length, data: nominees });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getNomineeById = async (req, res) => {
  try {
    const nominee = await Nominee.findById(req.params.id);
    if (!nominee) return res.status(404).json({ success: false, message: 'Nominee not found.' });
    res.status(200).json({ success: true, data: nominee });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.updateNomineeById = async (req, res) => {
  try {
    const nominee = await Nominee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!nominee) return res.status(404).json({ success: false, message: 'Nominee not found.' });
    res.status(200).json({ success: true, data: nominee });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.deleteNomineeById = async (req, res) => {
  try {
    const nominee = await Nominee.findByIdAndDelete(req.params.id);
    if (!nominee) return res.status(404).json({ success: false, message: 'Nominee not found.' });
    res.status(200).json({ success: true, message: 'Nominee deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};
// @route     GET /api/v1/nominee
// @access    Protected
exports.getNominees = async (req, res) => {
  try {
    const nominees = await Nominee.find();
    res.status(200).json({ success: true, count: nominees.length, data: nominees });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE NOMINEE
// @route     PUT /api/v1/nominee
// @access    Protected
exports.updateNominee = async (req, res) => {
  try {
    const { id } = req.body;
    const nominee = await Nominee.findByIdAndUpdate(id, req.body, { new: true });
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found.' });
    }
    res.status(200).json({ success: true, data: nominee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE NOMINEE
// @route     DELETE /api/v1/nominee
// @access    Protected
exports.deleteNominee = async (req, res) => {
  try {
    const { id } = req.query;
    const nominee = await Nominee.findByIdAndDelete(id);
    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found.' });
    }
    res.status(200).json({ success: true, message: 'Nominee deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

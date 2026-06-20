const Franchise = require("../model/Franchise");

exports.getFranchiseById = async (req, res) => {
  try {
    const franchise = await Franchise.findById(req.params.id);
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found.' });
    res.status(200).json({ success: true, data: franchise });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.updateFranchiseById = async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found.' });
    res.status(200).json({ success: true, data: franchise });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.deleteFranchiseById = async (req, res) => {
  try {
    const franchise = await Franchise.findByIdAndDelete(req.params.id);
    if (!franchise) return res.status(404).json({ success: false, message: 'Franchise not found.' });
    res.status(200).json({ success: true, message: 'Franchise deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

// @desc      ADD FRANCHISE
// @route     POST /api/v1/franchises
// @access    public
exports.addFranchise = async (req, res) => {
  try {
    const existingFranchise = await Franchise.findOne({ name: req.body.name });
    if (existingFranchise) {
      return res.status(409).json({ success: false, message: 'Franchise already exists.' });
    }
    const franchise = await Franchise.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", franchise.name, "Franchise");
    res.status(201).json({ success: true, message: 'Franchise created.', franchise });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET ALL FRANCHISES
// @route     GET /api/v1/franchises
// @access    public
exports.getFranchises = async (req, res) => {
  try {
    const franchises = await Franchise.find();
    res.status(200).json({ success: true, data: franchises });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      UPDATE FRANCHISE
// @route     PUT /api/v1/franchises
// @access    public
exports.updateFranchise = async (req, res) => {
  try {
    const { id } = req.body;
    const franchise = await Franchise.findByIdAndUpdate(id, req.body, { new: true });
    if (!franchise) {
      return res.status(404).json({ success: false, message: 'Franchise not found.' });
    }
    await logUserActivity(req.user._id, req.ip, "Updated", franchise.name, "Franchise");
    res.status(200).json({ success: true, data: franchise });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      DELETE FRANCHISE
// @route     DELETE /api/v1/franchises
// @access    public
exports.deleteFranchise = async (req, res) => {
  try {
    const { id } = req.query;
    const franchise = await Franchise.findByIdAndDelete(id);
    if (!franchise) {
      return res.status(404).json({ success: false, message: 'Franchise not found.' });
    }
    await logUserActivity(req.user._id, req.ip, "Deleted", franchise.name, "Franchise");
    res.status(200).json({ success: true, message: 'Franchise deleted.' });
  } catch (err) {
    console.error(err);
    
    res.status(500).json({ success: false, message: err.toString() });
  }
};

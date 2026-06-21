const Nominee = require("../model/Nominee");
const { logUserActivity } = require("../utils/auditLog");

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
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      BULK ADD NOMINEES
// @route     POST /api/v1/nominee/bulk
// @access    protected
exports.bulkAddNominees = async (req, res) => {
  try {
    const { nominees, electionId } = req.body;
    if (!Array.isArray(nominees) || nominees.length === 0) {
      return res.status(400).json({ success: false, message: "No nominees provided." });
    }
    const docs = nominees.map((n) => ({
      name: n.name,
      gender: n.gender,
      status: n.status || "active",
      electionId: n.electionId || electionId,
    }));
    const created = await Nominee.insertMany(docs);
    await logUserActivity(req.user._id, req.ip, "Created", `${created.length} nominees`, "Nominee");
    res.status(201).json({ success: true, message: 'Nominees created.', count: created.length, data: created });
  } catch (err) {
    console.error(err);
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
    // Optional election filter + opt-in server-side pagination (only when ?page is provided)
    const filter = {};
    if (req.query.electionId) filter.electionId = req.query.electionId;

    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const total = await Nominee.countDocuments(filter);
      const paged = await Nominee.find(filter)
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

    const nominees = await Nominee.find(filter);
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

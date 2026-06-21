const Election = require("../model/Election");
const { logUserActivity } = require("../utils/auditLog");

// Multipart form fields arrive as strings; coerce the known boolean fields.
function normalizeElectionBody(body) {
  ["selfRegOpen", "votingOpen", "resultsPublished", "genderBasedSelection"].forEach((key) => {
    if (typeof body[key] === "string") {
      body[key] = body[key] === "true";
    }
  });
  return body;
}

// @desc      ADD ELECTION
// @route     POST /api/v1/elections
// @access    public
exports.addElection = async (req, res) => {
  try {
    normalizeElectionBody(req.body);
    if (req.file) {
      req.body.logo = { url: `/uploads/${req.file.filename}`, alt: req.body.title };
    }
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
    normalizeElectionBody(req.body);
    if (req.file) {
      req.body.logo = { url: `/uploads/${req.file.filename}`, alt: req.body.title };
    }
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

// @desc      PUBLISH / UNPUBLISH ELECTION RESULTS TO VOTERS
// @route     PATCH /api/v1/election/:id/publish
// @access    Protected (admins)
exports.publishResults = async (req, res) => {
  try {
    const publish = req.body.publish === undefined ? true : req.body.publish === true || req.body.publish === "true";
    const update = {
      resultsPublished: publish,
      resultsPublishedAt: publish ? new Date() : null,
    };
    const election = await Election.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!election) return res.status(404).json({ success: false, message: 'Election not found.' });
    await logUserActivity(
      req.user && req.user._id,
      req.ip,
      publish ? "Published Results" : "Unpublished Results",
      election.title,
      "Election"
    );
    res.status(200).json({ success: true, data: election });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: err.toString() }); }
};

exports.getElections = async (req, res) => {
  try {
    // Scope elections by the requesting user's role so each franchise only
    // sees its own elections (super admin sees everything).
    const filter = {};
    const user = req.user || {};
    if (user.role === "franchise_admin") {
      filter.franchiseId = user.franchiseId;
    } else if (user.role === "election_admin") {
      const ids = Array.isArray(user.electionAccess) ? user.electionAccess : [];
      filter._id = { $in: ids };
    } else if (req.query.franchiseId) {
      // super admin may optionally narrow to a single franchise
      filter.franchiseId = req.query.franchiseId;
    }
    if (req.query.status) filter.status = req.query.status;

    // Opt-in server-side pagination (only when ?page is provided)
    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const total = await Election.countDocuments(filter);
      const paged = await Election.find(filter)
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

    const elections = await Election.find(filter);
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

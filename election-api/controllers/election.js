const Election = require("../model/Election");
const User = require("../model/User");
const Nominee = require("../model/Nominee");
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
    const filter = {};
    const user = req.user || {};
    if (user.role === "franchise_admin") {
      filter.franchiseId = user.franchiseId;
    } else if (user.role === "election_admin") {
      const ids = Array.isArray(user.electionAccess) ? user.electionAccess : [];
      filter._id = { $in: ids };
    } else if (req.query.franchiseId) {
      filter.franchiseId = req.query.franchiseId;
    }
    if (req.query.status) filter.status = req.query.status;

    // Helper: enrich elections with real voter + nominee counts
    const enrichElections = async (electionDocs) => {
      if (electionDocs.length === 0) return [];
      const electionIds = electionDocs.map(e => e._id);

      const [voterAgg, nomineeAgg] = await Promise.all([
        User.aggregate([
          { $match: { electionAccess: { $in: electionIds } } },
          { $unwind: '$electionAccess' },
          { $match: { electionAccess: { $in: electionIds } } },
          { $group: { _id: '$electionAccess', count: { $sum: 1 } } },
        ]),
        Nominee.aggregate([
          { $match: { electionId: { $in: electionIds } } },
          { $group: { _id: '$electionId', count: { $sum: 1 } } },
        ]),
      ]);

      const voterMap = {};
      voterAgg.forEach(v => { voterMap[v._id?.toString()] = v.count; });
      const nomineeMap = {};
      nomineeAgg.forEach(n => { nomineeMap[n._id?.toString()] = n.count; });

      return electionDocs.map(e => ({
        ...e.toObject(),
        voterCount: voterMap[e._id?.toString()] || 0,
        nomineeCount: nomineeMap[e._id?.toString()] || 0,
      }));
    };

    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const total = await Election.countDocuments(filter);
      const paged = await Election.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const enriched = await enrichElections(paged);
      return res.status(200).json({
        success: true,
        count: enriched.length,
        pagination: { total, page, pageSize: limit, totalPages },
        data: enriched,
      });
    }

    const elections = await Election.find(filter);
    const enriched = await enrichElections(elections);
    res.status(200).json({ success: true, count: enriched.length, data: enriched });
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

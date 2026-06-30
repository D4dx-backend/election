<<<<<<< HEAD
const elections = require("../lib/supabase/elections");
=======
const Election = require("../model/Election");
const User = require("../model/User");
const Nominee = require("../model/Nominee");
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
const { logUserActivity } = require("../utils/auditLog");

function normalizeElectionBody(body) {
  ["selfRegOpen", "votingOpen", "resultsPublished", "genderBasedSelection"].forEach((key) => {
    if (typeof body[key] === "string") {
      body[key] = body[key] === "true";
    }
  });
  return body;
}

exports.addElection = async (req, res) => {
  try {
    normalizeElectionBody(req.body);
    if (req.file) {
      req.body.logo = { url: `/uploads/${req.file.filename}`, alt: req.body.title };
    }
    const election = await elections.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", election.title, "Election");
    res.status(201).json({ success: true, message: "Election created.", election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getElectionById = async (req, res) => {
  try {
    const election = await elections.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    res.status(200).json({ success: true, data: election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateElectionById = async (req, res) => {
  try {
    normalizeElectionBody(req.body);
    if (req.file) {
      req.body.logo = { url: `/uploads/${req.file.filename}`, alt: req.body.title };
    }
    const election = await elections.updateById(req.params.id, req.body);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    res.status(200).json({ success: true, data: election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteElectionById = async (req, res) => {
  try {
    const election = await elections.deleteById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    res.status(200).json({ success: true, message: "Election deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.publishResults = async (req, res) => {
  try {
    const publish = req.body.publish === undefined ? true : req.body.publish === true || req.body.publish === "true";
    const update = {
      resultsPublished: publish,
      resultsPublishedAt: publish ? new Date().toISOString() : null,
    };
    const election = await elections.updateById(req.params.id, update);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    await logUserActivity(
      req.user && req.user._id,
      req.ip,
      publish ? "Published Results" : "Unpublished Results",
      election.title,
      "Election"
    );
    res.status(200).json({ success: true, data: election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getElections = async (req, res) => {
  try {
    const filter = {};
    const user = req.user || {};
    if (user.role === "franchise_admin") {
      filter.franchiseId = user.franchiseId;
    } else if (user.role === "election_admin") {
      const ids = Array.isArray(user.electionAccess) ? user.electionAccess : [];
      filter.ids = ids;
    } else if (req.query.franchiseId) {
      filter.franchiseId = req.query.franchiseId;
    }
    if (req.query.status) filter.status = req.query.status;

<<<<<<< HEAD
=======
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

>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const { elections: paged, total } = await elections.findWithPagination(filter, page, limit);
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      const enriched = await enrichElections(paged);
      return res.status(200).json({
        success: true,
        count: enriched.length,
        pagination: { total, page, pageSize: limit, totalPages },
        data: enriched,
      });
    }

<<<<<<< HEAD
    const data = await elections.find(filter);
    res.status(200).json({ success: true, count: data.length, data });
=======
    const elections = await Election.find(filter);
    const enriched = await enrichElections(elections);
    res.status(200).json({ success: true, count: enriched.length, data: enriched });
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateElection = async (req, res) => {
  try {
    const { id } = req.body;
    const election = await elections.updateById(id, req.body);
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found." });
    }
    res.status(200).json({ success: true, data: election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteElection = async (req, res) => {
  try {
    const { id } = req.query;
    const election = await elections.deleteById(id);
    if (!election) {
      return res.status(404).json({ success: false, message: "Election not found." });
    }
    res.status(200).json({ success: true, message: "Election deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

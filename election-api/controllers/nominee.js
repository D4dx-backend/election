const nominees = require("../lib/supabase/nominees");
const elections = require("../lib/supabase/elections");
const { logUserActivity } = require("../utils/auditLog");
const { denyUnlessCanAccessElection } = require("../lib/electionAccess");
const { uploadPhotoFromBase64 } = require("../lib/photoUpload");

async function resolveNomineeElectionScope(user) {
  if (!user || user.role === "super_admin") return null;

  const electionFilter = {};
  if (user.role === "franchise_admin") {
    electionFilter.franchiseId = user.franchiseId;
  } else if (user.role === "election_admin") {
    electionFilter.ids = Array.isArray(user.electionAccess) ? user.electionAccess : [];
  } else {
    return null;
  }

  const scopedElections = await elections.find(electionFilter);
  return scopedElections.map((e) => e._id || e.id).filter(Boolean);
}

async function buildNomineePayload(req) {
  const body = req.body || {};
  const payload = {};

  if (body.name !== undefined) payload.name = body.name;
  if (body.electionId !== undefined) payload.electionId = String(body.electionId).trim();
  if (body.gender !== undefined && body.gender !== "") payload.gender = body.gender;
  if (body.status !== undefined) payload.status = body.status;

  const description =
    body.description !== undefined ? body.description : body.bio;
  if (description !== undefined) {
    const trimmed = String(description).trim();
    payload.bio = trimmed || null;
  }

  if (req.file?.cdnUrl) {
    payload.photo = {
      url: req.file.cdnUrl,
      alt: body.name ? String(body.name).trim() : "Nominee photo",
    };
  } else if (body.photoBase64) {
    const url = await uploadPhotoFromBase64(
      body.photoBase64,
      "nominees",
      body.name || "nominee"
    );
    payload.photo = {
      url,
      alt: body.name ? String(body.name).trim() : "Nominee photo",
    };
  } else if (body.photo?.url) {
    payload.photo = {
      url: String(body.photo.url).trim(),
      alt: body.photo?.alt || (body.name ? String(body.name).trim() : "Nominee photo"),
    };
  }

  return payload;
}

exports.addNominee = async (req, res) => {
  try {
    const payload = await buildNomineePayload(req);
    if (!payload.electionId || !String(payload.electionId).trim()) {
      return res.status(400).json({ success: false, message: "electionId is required." });
    }
    payload.electionId = String(payload.electionId).trim();

    const election = await elections.findById(payload.electionId);
    if (!election) {
      return res.status(400).json({ success: false, message: "Election not found." });
    }
    if (await denyUnlessCanAccessElection(req, res, election)) return;

    if (!payload.status) payload.status = "active";
    const nominee = await nominees.create(payload);
    await logUserActivity(req.user._id, req.ip, "Created", nominee.name, "Nominee");
    res.status(201).json({ success: true, message: "Nominee created.", nominee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.bulkAddNominees = async (req, res) => {
  try {
    const { nominees: nomineeList, electionId } = req.body;
    if (!Array.isArray(nomineeList) || nomineeList.length === 0) {
      return res.status(400).json({ success: false, message: "No nominees provided." });
    }
    const docs = nomineeList.map((n) => ({
      name: n.name,
      gender: n.gender,
      status: n.status || "active",
      electionId: n.electionId || electionId,
    }));
    const created = await nominees.insertMany(docs);
    await logUserActivity(req.user._id, req.ip, "Created", `${created.length} nominees`, "Nominee");
    res.status(201).json({ success: true, message: "Nominees created.", count: created.length, data: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getNomineesByElection = async (req, res) => {
  try {
    const election = await elections.findById(req.params.electionId);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (await denyUnlessCanAccessElection(req, res, election)) return;

    const data = await nominees.findByElection(req.params.electionId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getNomineeById = async (req, res) => {
  try {
    const nominee = await nominees.findById(req.params.id);
    if (!nominee) return res.status(404).json({ success: false, message: "Nominee not found." });
    res.status(200).json({ success: true, data: nominee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateNomineeById = async (req, res) => {
  try {
    const nominee = await nominees.updateById(req.params.id, await buildNomineePayload(req));
    if (!nominee) return res.status(404).json({ success: false, message: "Nominee not found." });
    res.status(200).json({ success: true, data: nominee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteNomineeById = async (req, res) => {
  try {
    const nominee = await nominees.deleteById(req.params.id);
    if (!nominee) return res.status(404).json({ success: false, message: "Nominee not found." });
    res.status(200).json({ success: true, message: "Nominee deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getNominees = async (req, res) => {
  try {
    const filter = {};
    if (req.query.electionId) filter.electionId = req.query.electionId;
    if (req.query.search) filter.search = req.query.search;

    if (!filter.electionId) {
      const electionIds = await resolveNomineeElectionScope(req.user);
      if (electionIds !== null) {
        filter.electionIds = electionIds;
      }
    }

    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const { nominees: paged, total } = await nominees.find(filter, { page, limit });
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      return res.status(200).json({
        success: true,
        count: paged.length,
        pagination: { total, page, pageSize: limit, totalPages },
        data: paged,
      });
    }

    const { nominees: data } = await nominees.find(filter);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.updateNominee = async (req, res) => {
  try {
    const { id } = req.body;
    const nominee = await nominees.updateById(id, req.body);
    if (!nominee) {
      return res.status(404).json({ success: false, message: "Nominee not found." });
    }
    res.status(200).json({ success: true, data: nominee });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteNominee = async (req, res) => {
  try {
    const { id } = req.query;
    const nominee = await nominees.deleteById(id);
    if (!nominee) {
      return res.status(404).json({ success: false, message: "Nominee not found." });
    }
    res.status(200).json({ success: true, message: "Nominee deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

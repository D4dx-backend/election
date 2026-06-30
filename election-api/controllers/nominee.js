const nominees = require("../lib/supabase/nominees");
const { logUserActivity } = require("../utils/auditLog");

exports.addNominee = async (req, res) => {
  try {
    const nominee = await nominees.create(req.body);
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
    const nominee = await nominees.updateById(req.params.id, req.body);
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

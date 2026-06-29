const franchises = require("../lib/supabase/franchises");
const { logUserActivity } = require("../utils/auditLog");
const { sameFranchise } = require("../lib/roles");

function assertFranchiseAccess(actor, franchise) {
  if (!franchise) return;
  if (actor.role === "super_admin") return;
  if (!sameFranchise(actor.franchiseId, franchise._id || franchise.id)) {
    const err = new Error("You are not allowed to access this franchise.");
    err.statusCode = 403;
    throw err;
  }
}

function sendError(res, err) {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ success: false, message: err.message || err.toString() });
}

exports.getFranchiseById = async (req, res) => {
  try {
    const franchise = await franchises.findById(req.params.id);
    if (!franchise) return res.status(404).json({ success: false, message: "Franchise not found." });
    assertFranchiseAccess(req.user, franchise);
    res.status(200).json({ success: true, data: franchise });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateFranchiseById = async (req, res) => {
  try {
    const existing = await franchises.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: "Franchise not found." });
    assertFranchiseAccess(req.user, existing);

    if (req.file) {
      req.body.logo = { url: `/uploads/${req.file.filename}`, alt: req.body.name };
    }
    const franchise = await franchises.updateById(req.params.id, req.body);
    res.status(200).json({ success: true, data: franchise });
  } catch (err) {
    sendError(res, err);
  }
};

exports.deleteFranchiseById = async (req, res) => {
  try {
    const franchise = await franchises.deleteById(req.params.id);
    if (!franchise) return res.status(404).json({ success: false, message: "Franchise not found." });
    res.status(200).json({ success: true, message: "Franchise deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.addFranchise = async (req, res) => {
  try {
    const existingFranchise = await franchises.findByName(req.body.name);
    if (existingFranchise) {
      return res.status(409).json({ success: false, message: "Franchise already exists." });
    }
    if (req.file) {
      req.body.logo = { url: `/uploads/${req.file.filename}`, alt: req.body.name };
    }
    const franchise = await franchises.create(req.body);
    await logUserActivity(req.user._id, req.ip, "Created", franchise.name, "Franchise");
    res.status(201).json({ success: true, message: "Franchise created.", franchise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getFranchises = async (req, res) => {
  try {
    const scopedFranchiseId =
      req.user.role === "super_admin" ? undefined : req.user.franchiseId;

    if (req.query.page !== undefined) {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.max(parseInt(req.query.limit || req.query.pageSize, 10) || 10, 1);
      const { franchises: paged, total } = await franchises.findAll({ page, limit, franchiseId: scopedFranchiseId });
      const totalPages = Math.max(Math.ceil(total / limit), 1);
      return res.status(200).json({
        success: true,
        count: paged.length,
        pagination: { total, page, pageSize: limit, totalPages },
        data: paged,
      });
    }

    const { franchises: data } = await franchises.findAll({ franchiseId: scopedFranchiseId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    sendError(res, err);
  }
};

exports.updateFranchise = async (req, res) => {
  try {
    const { id } = req.body;
    const franchise = await franchises.updateById(id, req.body);
    if (!franchise) {
      return res.status(404).json({ success: false, message: "Franchise not found." });
    }
    await logUserActivity(req.user._id, req.ip, "Updated", franchise.name, "Franchise");
    res.status(200).json({ success: true, data: franchise });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.deleteFranchise = async (req, res) => {
  try {
    const { id } = req.query;
    const franchise = await franchises.deleteById(id);
    if (!franchise) {
      return res.status(404).json({ success: false, message: "Franchise not found." });
    }
    await logUserActivity(req.user._id, req.ip, "Deleted", franchise.name, "Franchise");
    res.status(200).json({ success: true, message: "Franchise deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

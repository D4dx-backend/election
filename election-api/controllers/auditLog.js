const auditLogs = require("../lib/supabase/auditLogs");

exports.addAuditLog = async (req, res) => {
  try {
    const logData = {
      ...req.body,
      userId: req.user ? req.user._id || req.user.id : null,
      ipAddress: req.ip,
    };
    const auditLog = await auditLogs.create(logData);
    res.status(201).json({ success: true, message: "Audit log created.", auditLog });
  } catch (err) {
    console.error("Controller Error in addAuditLog:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);

    const { logs, total } = await auditLogs.findAll({ page, limit });
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.status(200).json({
      success: true,
      count: logs.length,
      pagination: { total, page, limit, totalPages },
      data: logs,
    });
  } catch (err) {
    console.error("Controller Error in getAuditLogs:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

exports.getAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    const auditLog = await auditLogs.findById(id);
    if (!auditLog) {
      return res.status(404).json({ success: false, message: "Audit log not found." });
    }
    res.status(200).json({ success: true, data: auditLog });
  } catch (err) {
    console.error("Controller Error in getAuditLog:", err.message);
    res.status(500).json({ success: false, message: err.toString() });
  }
};

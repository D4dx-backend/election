const AuditLog = require("../model/AuditLog");

// @desc      ADD AUDIT LOG
// @route     POST /api/v1/audit-log
// @access    Protected
exports.addAuditLog = async (req, res) => {
  try {
    // Assuming req.user is populated by 'protect' middleware
    // You might want to add more details to the log from req.body or req.user
    const logData = { 
      ...req.body, 
      userId: req.user ? req.user.id : null, // Safely access user ID
      ipAddress: req.ip 
    };
    console.log("Controller: Attempting to add audit log:", logData);
    const auditLog = await AuditLog.create(logData);
    console.log("Controller: Audit log created successfully:", auditLog);
    res.status(201).json({ success: true, message: 'Audit log created.', auditLog });
  } catch (err) {
    console.error("Controller Error in addAuditLog:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET ALL AUDIT LOGS
// @route     GET /api/v1/audit-log
// @access    Protected
exports.getAuditLogs = async (req, res) => {
  try {
    console.log("Controller: Attempting to get all audit logs");
    // Add any query parameters for filtering or pagination if needed
    const auditLogs = await AuditLog.find().populate('userId', 'username fullName email'); // Populate user details
    console.log("Controller: Retrieved all audit logs, count:", auditLogs.length);
    res.status(200).json({ success: true, count: auditLogs.length, data: auditLogs });
  } catch (err) {
    console.error("Controller Error in getAuditLogs:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// @desc      GET SINGLE AUDIT LOG
// @route     GET /api/v1/audit-log/:id
// @access    Protected
exports.getAuditLog = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Controller: Attempting to get audit log with ID: ${id}`);
    const auditLog = await AuditLog.findById(id).populate('userId', 'username fullName email');
    if (!auditLog) {
      console.log(`Controller: Audit log with ID: ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Audit log not found.' });
    }
    console.log("Controller: Retrieved single audit log:", auditLog);
    res.status(200).json({ success: true, data: auditLog });
  } catch (err) {
    console.error("Controller Error in getAuditLog:", err.message);
    if (typeof errorLog === "function") {
      errorLog(req, err);
    }
    res.status(500).json({ success: false, message: err.toString() });
  }
};

// Note: Audit logs are often immutable, so update/delete might not be standard.
// If you need them, they can be added similarly to other controllers.

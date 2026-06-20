const router = require("express").Router();
const { 
  addAuditLog, 
  getAuditLogs,
  getAuditLog      // For getting a single audit log
} = require("../controllers/auditLog"); // Ensure this path is correct
const { protect } = require("../middleware/auth"); // Ensure this path is correct

// Routes for the collection (e.g., /api/v1/audit-log)
router
  .route("/")
  .post(protect, addAuditLog)
  .get(protect, getAuditLogs);

// Route for a specific item by ID (e.g., /api/v1/audit-log/:id)
router
  .route("/:id")
  .get(protect, getAuditLog); // GET a single audit log

module.exports = router;

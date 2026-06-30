const router = require("express").Router();
const { 
  addAuditLog, 
  getAuditLogs,
  getAuditLog      // For getting a single audit log
} = require("../controllers/auditLog"); // Ensure this path is correct
const { protect, authorize } = require("../middleware/auth"); // Ensure this path is correct

const admin = authorize("super_admin", "franchise_admin", "election_admin");

// Routes for the collection (e.g., /api/v1/audit-log)
router
  .route("/")
  .post(protect, admin, addAuditLog)
  .get(protect, admin, getAuditLogs);

// Route for a specific item by ID (e.g., /api/v1/audit-log/:id)
router
  .route("/:id")
  .get(protect, admin, getAuditLog); // GET a single audit log

module.exports = router;

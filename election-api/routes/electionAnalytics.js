const router = require("express").Router();
const { 
  addElectionAnalytics, 
  getElectionAnalytics,    // For getting all analytics
  getElectionAnalytic,     // For getting a single analytic by ID
  updateElectionAnalytics, 
  deleteElectionAnalytics,
  getDashboardStats        // Aggregated dashboard statistics
} = require("../controllers/electionAnalytics"); // Ensure this path is correct
const { protect } = require("../middleware/auth"); // Ensure this path is correct and auth.js exports protect

// Aggregated dashboard statistics (must be declared before "/:id")
router.get("/dashboard", protect, getDashboardStats);

// Routes for the collection (e.g., /api/v1/election-analytics)
router
  .route("/")
  .post(protect, addElectionAnalytics)
  .get(protect, getElectionAnalytics);

// Routes for a specific item by ID (e.g., /api/v1/election-analytics/:id)
router
  .route("/:id")
  .get(protect, getElectionAnalytic)    // GET a single item
  .put(protect, updateElectionAnalytics)  // UPDATE a single item
  .delete(protect, deleteElectionAnalytics); // DELETE a single item

module.exports = router;

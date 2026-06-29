const router = require("express").Router();
const { addElection, getElections, getElectionById, updateElectionById, deleteElectionById, publishResults } = require("../controllers/election");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const admin = authorize("super_admin", "franchise_admin", "election_admin");

router
  .route("/")
  .post(protect, admin, upload.single("logo"), addElection)
  .get(protect, admin, getElections);

router.patch("/:id/publish", protect, admin, publishResults);

// GET /:id stays voter-accessible — the ballot and results pages need it.
router
  .route("/:id")
  .get(protect, getElectionById)
  .put(protect, admin, upload.single("logo"), updateElectionById)
  .delete(protect, admin, deleteElectionById);

module.exports = router;

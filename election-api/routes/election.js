const router = require("express").Router();
const { addElection, getElections, getElectionById, updateElectionById, deleteElectionById, publishResults } = require("../controllers/election");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router
  .route("/")
  .post(protect, upload.single("logo"), addElection)
  .get(protect, getElections);

router.patch("/:id/publish", protect, publishResults);

router
  .route("/:id")
  .get(protect, getElectionById)
  .put(protect, upload.single("logo"), updateElectionById)
  .delete(protect, deleteElectionById);

module.exports = router;

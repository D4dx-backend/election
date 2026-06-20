const router = require("express").Router();
const { addElection, getElections, getElectionById, updateElectionById, deleteElectionById } = require("../controllers/election");
const { protect } = require("../middleware/auth");

router
  .route("/")
  .post(protect, addElection)
  .get(protect, getElections);

router
  .route("/:id")
  .get(protect, getElectionById)
  .put(protect, updateElectionById)
  .delete(protect, deleteElectionById);

module.exports = router;

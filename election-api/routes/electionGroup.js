const router = require("express").Router();
const { addElectionGroup, getElectionGroups, getElectionGroupById, updateElectionGroupById, deleteElectionGroupById } = require("../controllers/electionGroup");
const { protect } = require("../middleware/auth");

router
  .route("/")
  .post(protect, addElectionGroup)
  .get(protect, getElectionGroups);

router
  .route("/:id")
  .get(protect, getElectionGroupById)
  .put(protect, updateElectionGroupById)
  .delete(protect, deleteElectionGroupById);

module.exports = router;

const router = require("express").Router();
const { addElectionGroup, getElectionGroups, getElectionGroupById, updateElectionGroupById, deleteElectionGroupById } = require("../controllers/electionGroup");
const { protect, authorize } = require("../middleware/auth");

const admin = authorize("super_admin", "franchise_admin", "election_admin");

router
  .route("/")
  .post(protect, admin, addElectionGroup)
  .get(protect, admin, getElectionGroups);

router
  .route("/:id")
  .get(protect, admin, getElectionGroupById)
  .put(protect, admin, updateElectionGroupById)
  .delete(protect, admin, deleteElectionGroupById);

module.exports = router;

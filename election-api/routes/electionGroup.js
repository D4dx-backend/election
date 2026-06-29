const router = require("express").Router();
const { addElectionGroup, getElectionGroups, getElectionGroupById, updateElectionGroupById, deleteElectionGroupById } = require("../controllers/electionGroup");
const { protect, authorize } = require("../middleware/auth");

const franchiseOrSuper = authorize("super_admin", "franchise_admin");

router
  .route("/")
  .post(protect, franchiseOrSuper, addElectionGroup)
  .get(protect, franchiseOrSuper, getElectionGroups);

router
  .route("/:id")
  .get(protect, franchiseOrSuper, getElectionGroupById)
  .put(protect, franchiseOrSuper, updateElectionGroupById)
  .delete(protect, franchiseOrSuper, deleteElectionGroupById);

module.exports = router;

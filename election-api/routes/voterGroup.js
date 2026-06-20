const router = require("express").Router();
const { addVoterGroup, getVoterGroups, getVoterGroupById, updateVoterGroupById, deleteVoterGroupById } = require("../controllers/voterGroup");
const { protect } = require("../middleware/auth");

router
  .route("/")
  .post(protect, addVoterGroup)
  .get(protect, getVoterGroups);

router
  .route("/:id")
  .get(protect, getVoterGroupById)
  .put(protect, updateVoterGroupById)
  .delete(protect, deleteVoterGroupById);

module.exports = router;

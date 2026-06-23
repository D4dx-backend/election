const router = require("express").Router();
const {
  addVoterGroup,
  getVoterGroups,
  getVoterGroupById,
  updateVoterGroupById,
  deleteVoterGroupById,
  assignElections,
  getGroupVoters,
  addVoterToGroup,
  generateVotersInGroup,
  addExistingUsersToGroup,
} = require("../controllers/voterGroup");
const { protect } = require("../middleware/auth");

router.route("/").post(protect, addVoterGroup).get(protect, getVoterGroups);
router.route("/:id").get(protect, getVoterGroupById).put(protect, updateVoterGroupById).delete(protect, deleteVoterGroupById);
router.route("/:id/elections").put(protect, assignElections);
router.route("/:id/voters").get(protect, getGroupVoters);
router.route("/:id/voter").post(protect, addVoterToGroup);
router.route("/:id/generate").post(protect, generateVotersInGroup);
router.route("/:id/add-users").post(protect, addExistingUsersToGroup);

module.exports = router;

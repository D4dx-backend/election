const router = require("express").Router();
const {
  addVoterGroup,
  getVoterGroups,
  getVoterGroupById,
  updateVoterGroupById,
  deleteVoterGroupById,
  addVotersToGroup,
  removeVotersFromGroup,
  assignElections,
  getGroupVoters,
  addVoterToGroup,
  generateVotersInGroup,
} = require("../controllers/voterGroup");
const { protect, authorize } = require("../middleware/auth");

const admin = authorize("super_admin", "franchise_admin", "election_admin");

router
  .route("/")
  .post(protect, admin, addVoterGroup)
  .get(protect, admin, getVoterGroups);

router.post("/:id/add-voters", protect, admin, addVotersToGroup);
router.post("/:id/remove-voters", protect, admin, removeVotersFromGroup);
router.put("/:id/elections", protect, admin, assignElections);
router.get("/:id/voters", protect, admin, getGroupVoters);
router.post("/:id/voter", protect, admin, addVoterToGroup);
router.post("/:id/generate", protect, admin, generateVotersInGroup);

router
  .route("/:id")
  .get(protect, admin, getVoterGroupById)
  .put(protect, admin, updateVoterGroupById)
  .delete(protect, admin, deleteVoterGroupById);

module.exports = router;

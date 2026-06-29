const router = require("express").Router();
const {
  addVoterGroup,
  getVoterGroups,
  getVoterGroupById,
  updateVoterGroupById,
  deleteVoterGroupById,
  addVotersToGroup,
  removeVotersFromGroup,
} = require("../controllers/voterGroup");
const { protect, authorize } = require("../middleware/auth");

const admin = authorize("super_admin", "franchise_admin", "election_admin");

router
  .route("/")
  .post(protect, admin, addVoterGroup)
  .get(protect, admin, getVoterGroups);

router.post("/:id/add-voters", protect, admin, addVotersToGroup);
router.post("/:id/remove-voters", protect, admin, removeVotersFromGroup);

router
  .route("/:id")
  .get(protect, admin, getVoterGroupById)
  .put(protect, admin, updateVoterGroupById)
  .delete(protect, admin, deleteVoterGroupById);

module.exports = router;

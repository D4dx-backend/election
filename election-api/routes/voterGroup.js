const router = require("express").Router();
const {
  addVoterGroup,
  getVoterGroups,
  getVoterGroupById,
  updateVoterGroupById,
  deleteVoterGroupById,
<<<<<<< HEAD
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
=======
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
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3

module.exports = router;

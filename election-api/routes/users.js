const router = require("express").Router();
const {
  addUser, getUsers, updateUser, deleteUser,
  getUserById, getFranchiseAdmins, getElectionAdmins,
  createFranchiseAdmin, createElectionAdmin, resetPassword, getAllVoters,
  generateVoters, createVoter
} = require("../controllers/user");
const { protect, authorize } = require("../middleware/auth");

// User management is admin-only; voters must never reach these endpoints.
const admin = authorize("super_admin", "franchise_admin", "election_admin");

router.route("/").post(addUser).get(protect, admin, getUsers);
router.get("/franchise-admins", protect, admin, getFranchiseAdmins);
router.get("/election-admins", protect, admin, getElectionAdmins);
router.get("/voters", protect, admin, getAllVoters);
router.post("/voters", protect, admin, createVoter);
router.post("/voters/generate", protect, admin, generateVoters);
router.delete("/voters/:id", protect, admin, deleteUser);
router.post("/franchise-admin", protect, admin, createFranchiseAdmin);
router.post("/election-admin", protect, admin, createElectionAdmin);
router.route("/:id").get(protect, admin, getUserById).put(protect, admin, updateUser).delete(protect, admin, deleteUser);
router.post("/:id/reset-password", protect, admin, resetPassword);

module.exports = router;

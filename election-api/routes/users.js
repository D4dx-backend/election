const router = require("express").Router();
const {
  addUser, getUsers, updateUser, deleteUser,
  getUserById, getFranchiseAdmins, getElectionAdmins,
  createFranchiseAdmin, createElectionAdmin, resetPassword, getAllVoters,
<<<<<<< HEAD
  generateVoters, createVoter, assignVotersToElection,
} = require("../controllers/user");
const { protect, authorize } = require("../middleware/auth");

const admin = authorize("super_admin", "franchise_admin", "election_admin");
const superAdmin = authorize("super_admin");
const franchiseOrSuper = authorize("super_admin", "franchise_admin");

router.route("/").post(protect, admin, addUser).get(protect, admin, getUsers);
router.get("/franchise-admins", protect, franchiseOrSuper, getFranchiseAdmins);
router.get("/election-admins", protect, franchiseOrSuper, getElectionAdmins);
router.get("/voters", protect, admin, getAllVoters);
router.post("/voters", protect, admin, createVoter);
router.post("/voters/generate", protect, admin, generateVoters);
router.post("/voters/assign-election", protect, admin, assignVotersToElection);
router.delete("/voters/:id", protect, admin, deleteUser);
router.post("/franchise-admin", protect, superAdmin, createFranchiseAdmin);
router.post("/election-admin", protect, franchiseOrSuper, createElectionAdmin);
router.route("/:id").get(protect, admin, getUserById).put(protect, admin, updateUser).delete(protect, admin, deleteUser);
router.post("/:id/reset-password", protect, admin, resetPassword);
=======
  generateVoters, createVoter, addUsersToElection
} = require("../controllers/user");
const { protect, authorize } = require("../middleware/auth");

router.route("/").post(addUser).get(protect, getUsers);
router.get("/franchise-admins", protect, getFranchiseAdmins);
router.get("/election-admins", protect, getElectionAdmins);
router.get("/voters", protect, getAllVoters);
router.post("/voters", protect, createVoter);
router.post("/voters/generate", protect, generateVoters);
router.delete("/voters/:id", protect, deleteUser);
router.post("/add-to-election", protect, addUsersToElection);
router.post("/franchise-admin", protect, createFranchiseAdmin);
router.post("/election-admin", protect, createElectionAdmin);
router.route("/:id").get(protect, getUserById).put(protect, updateUser).delete(protect, deleteUser);
router.post("/:id/reset-password", protect, resetPassword);
>>>>>>> 26f9afb79dfc63f3d314199da825cd1ac733f5b3

module.exports = router;

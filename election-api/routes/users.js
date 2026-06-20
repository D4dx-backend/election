const router = require("express").Router();
const {
  addUser, getUsers, updateUser, deleteUser,
  getUserById, getFranchiseAdmins, getElectionAdmins,
  createFranchiseAdmin, createElectionAdmin, resetPassword, getAllVoters
} = require("../controllers/user");
const { protect, authorize } = require("../middleware/auth");

router.route("/").post(addUser).get(protect, getUsers);
router.get("/franchise-admins", protect, getFranchiseAdmins);
router.get("/election-admins", protect, getElectionAdmins);
router.get("/voters", protect, getAllVoters);
router.post("/franchise-admin", protect, createFranchiseAdmin);
router.post("/election-admin", protect, createElectionAdmin);
router.route("/:id").get(protect, getUserById).put(protect, updateUser).delete(protect, deleteUser);
router.post("/:id/reset-password", protect, resetPassword);

module.exports = router;

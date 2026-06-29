const router = require("express").Router();
const { addFranchise, getFranchises, getFranchiseById, updateFranchiseById, deleteFranchiseById } = require("../controllers/franchise");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

const admin = authorize("super_admin", "franchise_admin", "election_admin");

router
  .route("/")
  .post(protect, admin, upload.single("logo"), addFranchise)
  .get(protect, admin, getFranchises);

router
  .route("/:id")
  .get(protect, admin, getFranchiseById)
  .put(protect, admin, upload.single("logo"), updateFranchiseById)
  .delete(protect, admin, deleteFranchiseById);

module.exports = router;

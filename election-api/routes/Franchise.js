const router = require("express").Router();
const { addFranchise, getFranchises, getFranchiseById, updateFranchiseById, deleteFranchiseById } = require("../controllers/franchise");
const { protect } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

router
  .route("/")
  .post(protect, upload.single("logo"), addFranchise)
  .get(protect, getFranchises);

router
  .route("/:id")
  .get(protect, getFranchiseById)
  .put(protect, upload.single("logo"), updateFranchiseById)
  .delete(protect, deleteFranchiseById);

module.exports = router;

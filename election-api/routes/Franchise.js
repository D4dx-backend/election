const router = require("express").Router();
const { addFranchise, getFranchises, getFranchiseById, updateFranchiseById, deleteFranchiseById } = require("../controllers/franchise");
const { protect } = require("../middleware/auth");

router
  .route("/")
  .post(protect, addFranchise)
  .get(protect, getFranchises);

router
  .route("/:id")
  .get(protect, getFranchiseById)
  .put(protect, updateFranchiseById)
  .delete(protect, deleteFranchiseById);

module.exports = router;

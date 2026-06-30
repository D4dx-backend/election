const router = require("express").Router();
const { login, getCurrentUser, updateProfile, changePassword, forgotPassword } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/me", protect, getCurrentUser);
router.put("/me", protect, updateProfile);
router.post("/change-password", protect, changePassword);

module.exports = router;

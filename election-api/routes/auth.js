const router = require("express").Router();
const { login, getCurrentUser, updateProfile, changePassword } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, getCurrentUser);
router.put("/me", protect, updateProfile);
router.post("/change-password", protect, changePassword);

module.exports = router;

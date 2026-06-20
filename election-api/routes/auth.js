const router = require("express").Router();
const { login, getCurrentUser } = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, getCurrentUser);

module.exports = router;

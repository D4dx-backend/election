const router = require("express").Router();
const { getNotifications } = require("../controllers/notifications");
const { protect, authorize } = require("../middleware/auth");

const authenticated = authorize(
  "super_admin",
  "franchise_admin",
  "election_admin",
  "voter"
);

router.get("/", protect, authenticated, getNotifications);

module.exports = router;

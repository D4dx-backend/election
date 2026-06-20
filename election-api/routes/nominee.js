const router = require("express").Router();
const { addNominee, getNominees, getNomineeById, getNomineesByElection, updateNomineeById, deleteNomineeById } = require("../controllers/nominee");
const { protect } = require("../middleware/auth");

router.route("/").post(protect, addNominee).get(protect, getNominees);
router.route("/election/:electionId").get(protect, getNomineesByElection);
router.route("/:id").get(protect, getNomineeById).put(protect, updateNomineeById).delete(protect, deleteNomineeById);

module.exports = router;

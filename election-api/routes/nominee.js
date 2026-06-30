const router = require("express").Router();
const { addNominee, bulkAddNominees, getNominees, getNomineeById, getNomineesByElection, updateNomineeById, deleteNomineeById } = require("../controllers/nominee");
const { protect, authorize } = require("../middleware/auth");

const admin = authorize("super_admin", "franchise_admin", "election_admin");

router.route("/").post(protect, admin, addNominee).get(protect, admin, getNominees);
router.route("/bulk").post(protect, admin, bulkAddNominees);
// Voters need the nominee list for the ballot they are voting on.
router.route("/election/:electionId").get(protect, getNomineesByElection);
router.route("/:id").get(protect, admin, getNomineeById).put(protect, admin, updateNomineeById).delete(protect, admin, deleteNomineeById);

module.exports = router;

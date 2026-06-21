const router = require("express").Router();
const { addVote, getVotes, castVote, checkVoterStatus, getAvailableElections, getMyVote, getElectionResults } = require("../controllers/vote");
const { protect } = require("../middleware/auth");

router.route("/").post(protect, addVote).get(protect, getVotes);
router.get("/available-elections", protect, getAvailableElections);
router.get("/voter-status", protect, checkVoterStatus);
router.get("/results/:electionId", protect, getElectionResults);
router.get("/my-vote/:electionId", protect, getMyVote);
router.post("/cast/:electionId", protect, castVote);

module.exports = router;

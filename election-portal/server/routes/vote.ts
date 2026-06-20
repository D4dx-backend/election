import express from 'express';
import { protect, authorize } from '../controllers/authController';
import {
  getAvailableElections,
  checkVoterStatus,
  castVote,
  getMyVote
} from '../controllers/voteController';

const router = express.Router();

// All routes are protected and only accessible to voters
router.use(protect);
router.use(authorize('voter'));

// Get available elections for the current voter
router.get('/available-elections', getAvailableElections);

// Check voter status for all elections
router.get('/voter-status', checkVoterStatus);

// Cast vote for an election
router.post('/cast/:electionId', castVote);

// Get user's vote for a specific election
router.get('/my-vote/:electionId', getMyVote);

export default router;
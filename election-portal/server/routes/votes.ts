import { Router } from 'express';
import { 
  getAllVotes,
  getVote,
  getVotesByElection,
  checkVoterStatus,
  castVote
} from '../controllers/voteController';
import { protect, authorize } from '../controllers/authController';

const router = Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.get('/check/:electionId/:voterId', checkVoterStatus);

// Routes for voter access
router.post('/', castVote);

// Routes for admin access
router.get('/', authorize('super_admin', 'franchise_admin', 'election_admin'), getAllVotes);
router.get('/:id', authorize('super_admin', 'franchise_admin', 'election_admin'), getVote);
router.get('/election/:electionId', authorize('super_admin', 'franchise_admin', 'election_admin'), getVotesByElection);

export default router;
import { Router } from 'express';
import { 
  getAllElectionGroups,
  getElectionGroup,
  createElectionGroup,
  updateElectionGroup,
  deleteElectionGroup
} from '../controllers/electionGroupController';
import { protect, authorize } from '../controllers/authController';

const router = Router();

// Protect all routes
router.use(protect);

// Routes for admins only
router.get('/', authorize('super_admin', 'franchise_admin', 'election_admin'), getAllElectionGroups);
router.get('/:id', authorize('super_admin', 'franchise_admin', 'election_admin'), getElectionGroup);
router.post('/', authorize('super_admin', 'franchise_admin'), createElectionGroup);
router.put('/:id', authorize('super_admin', 'franchise_admin'), updateElectionGroup);
router.delete('/:id', authorize('super_admin', 'franchise_admin'), deleteElectionGroup);

export default router;
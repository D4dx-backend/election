import { Router } from 'express';
import { 
  getAllElections, 
  getElection, 
  createElection, 
  updateElection, 
  deleteElection 
} from '../controllers/electionController';
import { protect, authorize } from '../controllers/authController';

const router = Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.get('/', getAllElections);
router.get('/:id', getElection);

// Routes for admin users
router.post('/', authorize('super_admin', 'franchise_admin'), createElection);
router.put('/:id', authorize('super_admin', 'franchise_admin', 'election_admin'), updateElection);
router.delete('/:id', authorize('super_admin', 'franchise_admin'), deleteElection);

export default router;
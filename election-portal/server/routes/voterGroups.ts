import { Router } from 'express';
import { 
  getAllVoterGroups,
  getVoterGroup,
  createVoterGroup,
  updateVoterGroup,
  deleteVoterGroup,
  generateVoters
} from '../controllers/voterGroupController';
import { protect, authorize } from '../controllers/authController';

const router = Router();

// Protect all routes
router.use(protect);

// Routes for admins only
router.get('/', authorize('super_admin', 'franchise_admin', 'election_admin'), getAllVoterGroups);
router.get('/:id', authorize('super_admin', 'franchise_admin', 'election_admin'), getVoterGroup);
router.post('/', authorize('super_admin', 'franchise_admin'), createVoterGroup);
router.put('/:id', authorize('super_admin', 'franchise_admin'), updateVoterGroup);
router.delete('/:id', authorize('super_admin', 'franchise_admin'), deleteVoterGroup);
router.post('/generate-voters', authorize('super_admin', 'franchise_admin', 'election_admin'), generateVoters);

export default router;
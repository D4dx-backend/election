import { Router } from 'express';
import { 
  getAllNominees,
  getNominee,
  getNomineesByElection,
  createNominee,
  updateNominee,
  deleteNominee,
  createBulkNominees,
  importPreviousNominees
} from '../controllers/nomineeController';
import { protect, authorize } from '../controllers/authController';

const router = Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.get('/', getAllNominees);
router.get('/:id', getNominee);
router.get('/election/:electionId', getNomineesByElection);

// Routes for admin users
router.post('/', authorize('super_admin', 'franchise_admin', 'election_admin'), createNominee);
router.post('/bulk', authorize('super_admin', 'franchise_admin', 'election_admin'), createBulkNominees);
router.post('/import-previous', authorize('super_admin', 'franchise_admin', 'election_admin'), importPreviousNominees);
router.put('/:id', authorize('super_admin', 'franchise_admin', 'election_admin'), updateNominee);
router.delete('/:id', authorize('super_admin', 'franchise_admin', 'election_admin'), deleteNominee);

export default router;
import { Router } from 'express';
import { 
  getElectionAnalytics,
  refreshElectionAnalytics,
  finalizeElectionResults,
  getDashboardStats
} from '../controllers/analyticsController';
import { protect, authorize } from '../controllers/authController';

const router = Router();

// Protect all routes
router.use(protect);

// Get dashboard stats
router.get('/dashboard', getDashboardStats);

// Routes for specific elections
router.get('/election/:electionId', getElectionAnalytics);
router.post('/election/:electionId/refresh', authorize('super_admin', 'franchise_admin', 'election_admin'), refreshElectionAnalytics);
router.post('/election/:electionId/finalize', authorize('super_admin', 'franchise_admin', 'election_admin'), finalizeElectionResults);

export default router;
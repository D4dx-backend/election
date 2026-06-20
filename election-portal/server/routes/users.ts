import express from 'express';
import { 
  getAllVoters, 
  getVoter, 
  updateVoter, 
  deleteVoter, 
  resetVoterPassword,
  getFranchiseAdmins,
  createFranchiseAdmin,
  createElectionAdmin,
  resetFranchiseAdminPassword,
  generateVoters
} from '../controllers/userController';
import { protect, authorize } from '../controllers/authController';

const router = express.Router();

// Voter routes
router.route('/voters')
  .get(protect, getAllVoters);
  
// Generate voters in bulk
router.route('/voters/generate')
  .post(protect, authorize('super_admin', 'franchise_admin', 'election_admin'), generateVoters);

router.route('/voters/:id')
  .get(protect, getVoter)
  .put(protect, updateVoter)
  .delete(protect, deleteVoter);

router.route('/voters/:id/reset-password')
  .post(protect, resetVoterPassword);

// Franchise admin routes
router.route('/franchise-admin')
  .post(protect, authorize('super_admin'), createFranchiseAdmin);
  
// Franchise admin password reset
router.route('/franchise-admin/:id/reset-password')
  .post(protect, authorize('super_admin'), resetFranchiseAdminPassword);

// Election admin routes
router.route('/election-admin')
  .post(protect, authorize('super_admin', 'franchise_admin'), createElectionAdmin);

// Get franchise admins (must be added to a franchise route too)
router.route('/franchise/:franchiseId/admins')
  .get(protect, getFranchiseAdmins);

export default router;
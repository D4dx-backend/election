import { Router } from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  protect, 
  authorize
} from '../controllers/authController';

import {
  getAllVoters,
  getVoter,
  updateVoter,
  deleteVoter,
  resetVoterPassword,
  generateVoters
} from '../controllers/userController';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes - User management
router.post('/register', protect, authorize('super_admin', 'franchise_admin'), register);
router.get('/me', protect, getCurrentUser);

// Protected routes - Voter management
router.get('/voters', protect, authorize('super_admin', 'franchise_admin', 'election_admin'), getAllVoters);
router.post('/voters/generate', protect, generateVoters); // Simplified auth for testing
router.get('/voters/:id', protect, authorize('super_admin', 'franchise_admin', 'election_admin'), getVoter);
router.put('/voters/:id', protect, authorize('super_admin', 'franchise_admin', 'election_admin'), updateVoter);
router.delete('/voters/:id', protect, authorize('super_admin', 'franchise_admin', 'election_admin'), deleteVoter);
router.post('/voters/:id/reset-password', protect, authorize('super_admin', 'franchise_admin', 'election_admin'), resetVoterPassword);

export default router;
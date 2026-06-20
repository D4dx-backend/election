import { Router } from 'express';
import { protect } from '../controllers/authController';
import { 
  completeOnboarding, 
  getOnboardingStatus 
} from '../controllers/onboardingController';

const router = Router();

// Protected routes - require authentication
router.get('/status', protect, getOnboardingStatus);
router.post('/complete', protect, completeOnboarding);

export default router;
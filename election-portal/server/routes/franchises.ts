import { Router } from 'express';
import { 
  getAllFranchises, 
  getFranchise, 
  createFranchise, 
  updateFranchise, 
  deleteFranchise 
} from '../controllers/franchiseController';
import { protect, authorize } from '../controllers/authController';
import { uploadFranchiseLogo } from '../config/cloudinary';

const router = Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.get('/', getAllFranchises);
router.get('/:id', getFranchise);

// Get franchise administrators
import { getFranchiseAdmins } from '../controllers/userController';
router.get('/:franchiseId/admins', getFranchiseAdmins);

// Routes for admin users only
router.post('/', authorize('super_admin'), uploadFranchiseLogo.single('logo'), createFranchise);
router.put('/:id', authorize('super_admin'), uploadFranchiseLogo.single('logo'), updateFranchise);
router.delete('/:id', authorize('super_admin'), deleteFranchise);

export default router;
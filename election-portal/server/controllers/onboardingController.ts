import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

/**
 * Complete user onboarding
 * Updates the user's onboarding status in the database
 */
export const completeOnboarding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the user from the request (set by the protect middleware)
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
      return;
    }
    
    // Find and update the user's onboarding status
    const user = await User.findByIdAndUpdate(
      userId,
      { onboardingCompleted: true },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        onboardingCompleted: true
      }
    });
  } catch (error) {
    console.error('Error in completing onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Get user onboarding status
 * Returns the current onboarding status for the user
 */
export const getOnboardingStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get the user from the request (set by the protect middleware)
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
      return;
    }
    
    // Find the user and get their onboarding status
    const user = await User.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: {
        onboardingCompleted: user.onboardingCompleted || false
      }
    });
  } catch (error) {
    console.error('Error in getting onboarding status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
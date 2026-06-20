import { Request, Response, NextFunction } from 'express';
import Franchise from '../models/Franchise';
import cloudinary from '../config/cloudinary';

// Get all franchises
export const getAllFranchises = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const franchises = await Franchise.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: franchises.length,
      data: franchises
    });
  } catch (error) {
    next(error);
  }
};

// Get single franchise by ID
export const getFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      res.status(404).json({
        success: false,
        message: 'Franchise not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: franchise
    });
  } catch (error) {
    next(error);
  }
};

// Create new franchise
export const createFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get franchise data from request body
    const franchiseData = req.body;
    
    // Handle file upload if present in the request
    if (req.file) {
      // File was uploaded and processed by Cloudinary via multer
      franchiseData.logo = {
        url: req.file.path,
        alt: franchiseData.logoAlt || franchiseData.name
      };
    }
    
    // Create franchise in database
    const franchise = await Franchise.create(franchiseData);

    res.status(201).json({
      success: true,
      data: franchise
    });
  } catch (error) {
    console.error('Error creating franchise:', error);
    next(error);
  }
};

// Update franchise
export const updateFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get update data from request body
    const updateData = req.body;
    
    // Handle file upload if present in the request
    if (req.file) {
      // File was uploaded and processed by Cloudinary via multer
      updateData.logo = {
        url: req.file.path,
        alt: updateData.logoAlt || updateData.name
      };
    }
    
    const franchise = await Franchise.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!franchise) {
      res.status(404).json({
        success: false,
        message: 'Franchise not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: franchise
    });
  } catch (error) {
    console.error('Error updating franchise:', error);
    next(error);
  }
};

// Delete franchise
export const deleteFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const franchise = await Franchise.findById(req.params.id);

    if (!franchise) {
      res.status(404).json({
        success: false,
        message: 'Franchise not found'
      });
      return;
    }

    await franchise.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
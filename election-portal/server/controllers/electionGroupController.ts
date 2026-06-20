import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ElectionGroup from '../models/ElectionGroup';

/**
 * Get all election groups
 */
export const getAllElectionGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const franchiseId = req.query.franchiseId;
    let query = {};

    // Set query based on franchiseId from request or user role
    if (franchiseId) {
      query = { franchiseId };
    } else if (req.user && req.user.role === 'franchise_admin') {
      query = { franchiseId: req.user.franchiseId };
    }
    const electionGroups = await ElectionGroup.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: electionGroups.length,
      data: electionGroups
    });
  } catch (error) {
    console.error('Error getting election groups:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get single election group
 */
export const getElectionGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const electionGroup = await ElectionGroup.findById(req.params.id);

    if (!electionGroup) {
      res.status(404).json({
        success: false,
        error: 'Election group not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: electionGroup
    });
  } catch (error) {
    console.error('Error getting election group:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Create new election group
 */
export const createElectionGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Add user to body if available
    if (req.user && req.user._id) {
      req.body.createdBy = req.user._id;
      
      // If the user is a franchise admin, automatically set franchiseId
      if (req.user.role === 'franchise_admin' && req.user.franchiseId) {
        req.body.franchiseId = req.user.franchiseId;
      }
    }
    
    // Ensure franchiseId is set
    if (!req.body.franchiseId) {
      return res.status(400).json({
        success: false,
        error: "Franchise ID is required. Please select a franchise."
      });
    }

    const electionGroup = await ElectionGroup.create(req.body);

    res.status(201).json({
      success: true,
      data: electionGroup
    });
  } catch (error) {
    console.error('Error creating election group:', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      const messages = Object.values((error as any).errors).map(err => (err as any).message);

      res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Update election group
 */
export const updateElectionGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let electionGroup = await ElectionGroup.findById(req.params.id);

    if (!electionGroup) {
      res.status(404).json({
        success: false,
        error: 'Election group not found'
      });
      return;
    }

    // Check if user has permission (admin or owner of the franchise)
    if (req.user && req.user.role !== 'super_admin') {
      if (electionGroup.franchiseId.toString() !== req.user.franchiseId?.toString()) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to update this election group'
        });
        return;
      }
    }

    electionGroup = await ElectionGroup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: electionGroup
    });
  } catch (error) {
    console.error('Error updating election group:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Delete election group
 */
export const deleteElectionGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const electionGroup = await ElectionGroup.findById(req.params.id);

    if (!electionGroup) {
      res.status(404).json({
        success: false,
        error: 'Election group not found'
      });
      return;
    }

    // Check if user has permission (admin or owner of the franchise)
    if (req.user && req.user.role !== 'super_admin') {
      if (electionGroup.franchiseId.toString() !== req.user.franchiseId?.toString()) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to delete this election group'
        });
        return;
      }
    }

    await ElectionGroup.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting election group:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
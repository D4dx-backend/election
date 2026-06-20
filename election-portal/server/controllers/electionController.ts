import { Request, Response, NextFunction } from 'express';
import Election from '../models/Election';

// Get all elections
export const getAllElections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let query;

    // Build query based on filters
    const { franchiseId, status, fromDate, toDate } = req.query;
    
    const queryObject: any = {};
    
    // If user is franchise admin, only show their franchise's elections
    if (req.user.role === 'franchise_admin') {
      queryObject.franchiseId = req.user.franchiseId;
    }
    // For super admin, filter by franchise if provided
    else if (franchiseId) {
      queryObject.franchiseId = franchiseId;
    }
    
    // Filter by status if provided
    if (status) {
      queryObject.status = status;
    }
    
    // Filter by date range if provided
    if (fromDate || toDate) {
      queryObject.electionDate = {};
      
      if (fromDate) {
        queryObject.electionDate.$gte = new Date(fromDate as string);
      }
      
      if (toDate) {
        queryObject.electionDate.$lte = new Date(toDate as string);
      }
    }
    
    // Execute query
    query = Election.find(queryObject)
                    .populate('franchiseId', 'name logo')
                    .populate('electionGroupId', 'name')
                    .sort({ electionDate: -1 });

    const elections = await query;

    res.status(200).json({
      success: true,
      count: elections.length,
      data: elections
    });
  } catch (error) {
    next(error);
  }
};

// Get single election by ID
export const getElection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const election = await Election.findById(req.params.id)
                                  .populate('franchiseId', 'name logo')
                                  .populate('electionGroupId', 'name');

    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: election
    });
  } catch (error) {
    next(error);
  }
};

// Create new election
export const createElection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Add creator info
    req.body.createdBy = req.user._id;
    
    const election = await Election.create(req.body);

    res.status(201).json({
      success: true,
      data: election
    });
  } catch (error) {
    next(error);
  }
};

// Update election
export const updateElection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: election
    });
  } catch (error) {
    next(error);
  }
};

// Delete election
export const deleteElection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const election = await Election.findById(req.params.id);

    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }

    await election.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
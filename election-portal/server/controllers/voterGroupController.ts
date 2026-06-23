import { Request, Response, NextFunction } from 'express';
import VoterGroup from '../models/VoterGroup';
import Franchise from '../models/Franchise';
import User from '../models/User';
import mongoose from 'mongoose';

// Get all voter groups
export const getAllVoterGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let query;

    // Build query based on filters
    const { franchiseId } = req.query;

    const queryObject: any = {};

    // Filter by franchise if provided
    if (franchiseId) {
      queryObject.franchiseId = franchiseId;
    }

    // Execute query
    query = VoterGroup.find(queryObject)
                     .populate('franchiseId', 'name')
                     .sort({ name: 1 });

    const voterGroups = await query;

    res.status(200).json({
      success: true,
      count: voterGroups.length,
      data: voterGroups
    });
  } catch (error) {
    next(error);
  }
};

// Get single voter group by ID
export const getVoterGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voterGroup = await VoterGroup.findById(req.params.id)
                                       .populate('franchiseId', 'name');

    if (!voterGroup) {
      res.status(404).json({
        success: false,
        message: 'Voter group not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: voterGroup
    });
  } catch (error) {
    next(error);
  }
};

// Create new voter group
export const createVoterGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verify franchise exists
    const franchise = await Franchise.findById(req.body.franchiseId);
    if (!franchise) {
      res.status(404).json({
        success: false,
        message: 'Franchise not found'
      });
      return;
    }

    // Add creator info
    if (req.user && req.user._id) {
      req.body.createdBy = req.user._id;
    }

    const voterGroup = await VoterGroup.create(req.body);

    res.status(201).json({
      success: true,
      data: voterGroup
    });
  } catch (error) {
    next(error);
  }
};

// Update voter group
export const updateVoterGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voterGroup = await VoterGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!voterGroup) {
      res.status(404).json({
        success: false,
        message: 'Voter group not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: voterGroup
    });
  } catch (error) {
    next(error);
  }
};

// Delete voter group
export const deleteVoterGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voterGroup = await VoterGroup.findById(req.params.id);

    if (!voterGroup) {
      res.status(404).json({
        success: false,
        message: 'Voter group not found'
      });
      return;
    }

    await voterGroup.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Generate voters in bulk for a voter group
export const generateVoters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      prefix: userPrefix, 
      startingNumber: userStartingNumber, 
      count, 
      electionIds, 
      electionGroupId,
      assignmentType,
      voterGroupId 
    } = req.body;

    if (!count || count <= 0 || count > 1000) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid count between 1 and 1000'
      });
      return;
    }
    
    // If using a voter group, verify it exists
    let voterGroup = null;
    if (voterGroupId) {
      voterGroup = await VoterGroup.findById(voterGroupId).session(session);
      if (!voterGroup) {
        await session.abortTransaction();
        session.endSession();
        res.status(404).json({
          success: false,
          message: 'Voter group not found'
        });
        return;
      }
    }

    // Set default values if not provided or from voter group
    const voterPrefix = userPrefix || (voterGroup ? voterGroup.prefix : 'VOTE');
    let startingNumber = userStartingNumber || (voterGroup ? voterGroup.startingNumber : 1001);

    // Find the highest sequence number currently in use for the given prefix
    const highestUser = await User.findOne({ 
      prefix: voterPrefix,
      isVoter: true
    }).sort({ sequenceNumber: -1 }).session(session);

    if (highestUser && highestUser.sequenceNumber && highestUser.sequenceNumber >= startingNumber) {
      startingNumber = highestUser.sequenceNumber + 1;
    }

    // Handle election group - get all elections in the group if using electionGroupId
    let electionsToAssign = electionIds || [];
    
    if (assignmentType === 'electionGroup' && electionGroupId) {
      const Election = mongoose.models.Election || mongoose.model('Election');
      const groupElections = await Election.find({ electionGroupId }).session(session);
      
      if (groupElections && groupElections.length > 0) {
        electionsToAssign = groupElections.map((election) => election._id);
      }
    }

    // Find franchise ID - either from voter group or from the first election
    let franchiseId;
    if (voterGroup) {
      franchiseId = voterGroup.franchiseId;
    } else if (electionsToAssign.length > 0) {
      const Election = mongoose.models.Election || mongoose.model('Election');
      const election = await Election.findById(electionsToAssign[0]).session(session);
      if (election) {
        franchiseId = election.franchiseId;
      }
    }

    if (!franchiseId) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message: 'Unable to determine franchise ID for voters'
      });
      return;
    }

    // Generate voters
    const voters = [];
    const generatedVoters = [];

    for (let i = 0; i < count; i++) {
      const sequenceNumber = startingNumber + i;
      const username = `${voterPrefix}${sequenceNumber.toString().padStart(4, '0')}`;
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      const plainPassword = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');

      voters.push({
        username,
        password: plainPassword,
        plainPassword,
        role: 'voter',
        franchiseId: franchiseId,
        createdBy: req.user._id,
        status: 'active',
        isVoter: true,
        prefix: voterPrefix,
        sequenceNumber,
        electionAccess: electionsToAssign
      });
    }

    // Create voters in the database
    if (voters.length > 0) {
      const createdVoters = await User.create(voters, { session });

      // Prepare response data (exclude passwords)
      for (const voter of createdVoters) {
        generatedVoters.push({
          id: voter._id,
          username: voter.username,
          sequenceNumber: voter.sequenceNumber,
          prefix: voter.prefix
        });
      }
    }

    // Update starting number in voter group if one was used
    if (voterGroup) {
      voterGroup.startingNumber = startingNumber + count;
      await voterGroup.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      count: generatedVoters.length,
      data: generatedVoters
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
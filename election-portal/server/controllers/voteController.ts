import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Vote from '../models/Vote';
import Election from '../models/Election';
import Nominee from '../models/Nominee';
import User from '../models/User';

/**
 * Get available elections for the current voter
 */
export const getAvailableElections = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'voter') {
      res.status(403).json({
        success: false,
        message: 'Only voters can access this endpoint'
      });
      return;
    }

    // Get the elections the voter has access to
    const voter = await User.findById(req.user.id);
    if (!voter || !voter.electionAccess || voter.electionAccess.length === 0) {
      res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
      return;
    }

    // Get all elections the voter has access to
    const elections = await Election.find({
      _id: { $in: voter.electionAccess },
      status: 'active',
      votingOpen: true
    }).populate('franchiseId', 'name logo');

    res.status(200).json({
      success: true,
      count: elections.length,
      data: elections
    });
  } catch (error) {
    console.error('Error getting available elections:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Check voter status for all elections
 * Returns which elections the voter has already voted in
 */
export const checkVoterStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'voter') {
      res.status(403).json({
        success: false,
        message: 'Only voters can access this endpoint'
      });
      return;
    }

    // Get all votes cast by this voter
    const votes = await Vote.find({ voterId: req.user.id });
    
    // Create a map of electionId -> status
    const votingStatus: Record<string, string> = {};
    
    votes.forEach(vote => {
      votingStatus[vote.electionId.toString()] = 'voted';
    });

    res.status(200).json({
      success: true,
      data: votingStatus
    });
  } catch (error) {
    console.error('Error checking voter status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Cast vote for an election
 */
export const castVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!req.user || req.user.role !== 'voter') {
      res.status(403).json({
        success: false,
        message: 'Only voters can access this endpoint'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    const { electionId } = req.params;
    const { nomineeIds } = req.body;

    if (!electionId || !nomineeIds || !Array.isArray(nomineeIds)) {
      res.status(400).json({
        success: false,
        message: 'Invalid request: electionId and nomineeIds array are required'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Check if election exists and is open for voting
    const election = await Election.findById(electionId).session(session);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (!election.votingOpen || election.status !== 'active') {
      res.status(400).json({
        success: false,
        message: 'Election is not open for voting'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Check if voter has access to this election
    const voter = await User.findById(req.user.id).session(session);
    if (!voter || !voter.electionAccess || !voter.electionAccess.some(id => id.toString() === electionId)) {
      res.status(403).json({
        success: false,
        message: 'Voter does not have access to this election'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Check if voter has already voted in this election
    const existingVote = await Vote.findOne({
      voterId: req.user.id,
      electionId
    }).session(session);

    if (existingVote) {
      res.status(400).json({
        success: false,
        message: 'Voter has already cast a vote in this election'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Validate nominee IDs
    if (!nomineeIds || nomineeIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one nominee must be selected'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (nomineeIds.length > election.numberToBeElected) {
      res.status(400).json({
        success: false,
        message: `Maximum number of nominees that can be selected is ${election.numberToBeElected}`
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Verify all nominees exist and are active
    const nominees = await Nominee.find({
      _id: { $in: nomineeIds },
      electionId,
      status: 'active'
    }).session(session);

    if (nominees.length !== nomineeIds.length) {
      res.status(400).json({
        success: false,
        message: 'One or more selected nominees are invalid or inactive'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Create the vote
    const vote = new Vote({
      voterId: req.user.id,
      electionId,
      nominees: nomineeIds,
      timestamp: new Date()
    });

    await vote.save({ session });

    // If everything succeeded, commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Vote cast successfully',
      data: vote
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

/**
 * Get user's vote for a specific election
 */
export const getMyVote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'voter') {
      res.status(403).json({
        success: false,
        message: 'Only voters can access this endpoint'
      });
      return;
    }

    const { electionId } = req.params;

    // Find the vote
    const vote = await Vote.findOne({
      voterId: req.user.id,
      electionId
    });

    if (!vote) {
      res.status(404).json({
        success: false,
        message: 'No vote found for this election'
      });
      return;
    }

    // Get nominee details
    const nominees = await Nominee.find({
      _id: { $in: vote.nominees }
    });

    res.status(200).json({
      success: true,
      data: {
        _id: vote._id,
        electionId: vote.electionId,
        timestamp: vote.timestamp,
        nominees
      }
    });
  } catch (error) {
    console.error('Error getting vote details:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
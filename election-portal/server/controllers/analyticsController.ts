import { Request, Response, NextFunction } from 'express';
import ElectionAnalytics from '../models/ElectionAnalytics';
import Election from '../models/Election';
import Vote from '../models/Vote';
import User from '../models/User';
import Nominee from '../models/Nominee';
import mongoose from 'mongoose';

// Get analytics for a specific election
export const getElectionAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { electionId } = req.params;
    
    // Verify election exists
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }
    
    // Get analytics data
    let analytics = await ElectionAnalytics.findOne({ electionId });
    
    // If analytics don't exist yet, create them
    if (!analytics) {
      analytics = await calculateElectionAnalytics(electionId);
    }
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// Refresh analytics for a specific election
export const refreshElectionAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { electionId } = req.params;
    
    // Verify election exists
    const election = await Election.findById(electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }
    
    // Recalculate analytics
    const analytics = await calculateElectionAnalytics(electionId);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

// Finalize election results
export const finalizeElectionResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { electionId } = req.params;
    
    // Verify election exists
    const election = await Election.findById(electionId).session(session);
    if (!election) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }
    
    // Check if election is active
    if (election.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message: `Election is already ${election.status}`
      });
      return;
    }
    
    // Close voting
    election.votingOpen = false;
    election.status = 'completed';
    await election.save({ session });
    
    // Recalculate analytics
    const analytics = await ElectionAnalytics.findOne({ electionId }).session(session);
    
    if (!analytics) {
      // If analytics don't exist yet, create them
      await calculateElectionAnalytics(electionId, session);
    } else {
      // Update analytics
      analytics.isFinalized = true;
      analytics.lastUpdated = new Date();
      await analytics.save({ session });
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: 'Election completed and results finalized'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = {
      activeElections: 0,
      totalVoters: 0,
      votesCast: 0,
      totalFranchises: 0,
      totalElections: 0,
      franchiseDistribution: [],
      recentActivity: []
    };
    
    // Get active elections count
    stats.activeElections = await Election.countDocuments({ status: 'active' });
    
    // Get total voters count
    stats.totalVoters = await User.countDocuments({ isVoter: true });
    
    // Get total votes cast
    stats.votesCast = await Vote.countDocuments();
    
    // Get franchise stats
    const franchises = await Election.aggregate([
      { $group: { _id: '$franchiseId', count: { $sum: 1 } } },
      { $lookup: { from: 'franchises', localField: '_id', foreignField: '_id', as: 'franchise' } },
      { $unwind: '$franchise' },
      { $project: { name: '$franchise.name', count: 1 } }
    ]);
    
    stats.totalFranchises = franchises.length;
    stats.totalElections = await Election.countDocuments();
    
    // Calculate franchise distribution
    if (stats.totalElections > 0) {
      stats.franchiseDistribution = franchises.map(f => ({
        name: f.name,
        percentage: Math.round((f.count / stats.totalElections) * 100)
      }));
    }
    
    // Get recent activity
    const recentVotes = await Vote.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .populate('electionId', 'title')
      .populate('voterId', 'username');
      
    const recentElections = await Election.find()
      .sort({ createdAt: -1 })
      .limit(3);
      
    // Combine activities
    const activities = [
      ...recentVotes.map(v => ({
        action: `${v.voterId.username} voted in ${v.electionId.title}`,
        timestamp: v.timestamp,
        type: 'success'
      })),
      ...recentElections.map(e => ({
        action: `Election "${e.title}" was created`,
        timestamp: e.createdAt,
        type: 'info'
      }))
    ];
    
    // Sort by timestamp and get the most recent 10
    stats.recentActivity = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString()
      }));
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate election analytics
async function calculateElectionAnalytics(electionId: string, session?: mongoose.ClientSession) {
  // Get count of voters assigned to this election
  const totalVoters = await User.countDocuments({ 
    electionAccess: new mongoose.Types.ObjectId(electionId),
    isVoter: true
  }, { session });
  
  // Get count of votes cast in this election
  const totalVotesCast = await Vote.countDocuments({ 
    electionId
  }, { session });
  
  // Calculate pending voters
  const pendingVoters = totalVoters - totalVotesCast;
  
  // Get nominees
  const nominees = await Nominee.find({ 
    electionId,
    status: 'active'
  }, null, { session });
  
  // Calculate vote counts for each nominee
  const nomineeResults = [];
  
  for (const nominee of nominees) {
    const voteCount = await Vote.countDocuments({
      electionId,
      nominees: nominee._id
    }, { session });
    
    const percentage = totalVotesCast > 0 ? (voteCount / totalVotesCast) * 100 : 0;
    
    nomineeResults.push({
      nomineeId: nominee._id,
      nomineeName: nominee.name,
      voteCount,
      percentage
    });
  }
  
  // Sort by vote count (descending)
  nomineeResults.sort((a, b) => b.voteCount - a.voteCount);
  
  // Find or create analytics document
  let analytics = await ElectionAnalytics.findOne({ electionId }, null, { session });
  
  if (analytics) {
    // Update existing analytics
    analytics.totalVoters = totalVoters;
    analytics.totalVotesCast = totalVotesCast;
    analytics.pendingVoters = pendingVoters;
    analytics.nomineeResults = nomineeResults;
    analytics.lastUpdated = new Date();
    
    await analytics.save({ session });
  } else {
    // Create new analytics
    analytics = await ElectionAnalytics.create([{
      electionId,
      totalVoters,
      totalVotesCast,
      pendingVoters,
      nomineeResults,
      lastUpdated: new Date(),
      isFinalized: false
    }], { session: session });
    
    // Workaround for TypeScript issue with create() returning an array
    analytics = Array.isArray(analytics) ? analytics[0] : analytics;
  }
  
  return analytics;
}
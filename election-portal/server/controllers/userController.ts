import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import bcrypt from 'bcrypt';

/**
 * Get all voters with pagination
 */
export const getAllVoters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const skip = (page - 1) * pageSize;

    const query: any = { isVoter: true };

    // Handle additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by election access
    if (req.query.electionId && req.query.electionId !== 'all') {
      try {
        const electionIdString = req.query.electionId as string;
        // Log the raw election ID for debugging
        console.log(`Raw election ID from request: ${electionIdString}`);
        
        // If it's a valid MongoDB ObjectId, use it directly
        let electionId;
        if (mongoose.Types.ObjectId.isValid(electionIdString)) {
          electionId = new mongoose.Types.ObjectId(electionIdString);
        } else {
          // This covers cases where the ID might be coming from a different source
          electionId = electionIdString;
        }
        
        // Use $in operator to check if the electionId is in the electionAccess array
        query['electionAccess'] = { $in: [electionId] };
        console.log(`Filtering voters by election ID: ${electionId}`);
      } catch (error) {
        console.error('Error processing election ID:', error);
        // Return empty result set for invalid ID
        query['_id'] = null;
      }
    }

    // For franchise admin, only return voters for their franchise
    if (req.user?.role === 'franchise_admin' && req.user?.franchiseId) {
      query.franchiseId = req.user.franchiseId;
    }

    // For election admin, only return voters with access to their elections
    if (req.user?.role === 'election_admin' && req.user?.electionAccess && req.user.electionAccess.length > 0) {
      query.electionAccess = { $in: req.user.electionAccess };
    }

    // Count total matching records
    const total = await User.countDocuments(query);

    // Get the paginated voters
    const voters = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      },
      data: voters
    });
  } catch (error) {
    console.error('Error getting voters:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get single voter
 */
export const getVoter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voter = await User.findById(req.params.id).select('-password');

    if (!voter) {
      res.status(404).json({
        success: false,
        error: 'Voter not found'
      });
      return;
    }

    // Check if user is actually a voter
    if (!voter.isVoter) {
      res.status(400).json({
        success: false,
        error: 'User is not a voter'
      });
      return;
    }

    // Check permissions based on role
    if (req.user?.role === 'franchise_admin' && voter.franchiseId?.toString() !== req.user.franchiseId?.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view this voter'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: voter
    });
  } catch (error) {
    console.error('Error getting voter:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Update voter
 */
export const updateVoter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let voter = await User.findById(req.params.id);

    if (!voter) {
      res.status(404).json({
        success: false,
        error: 'Voter not found'
      });
      return;
    }

    // Check if user is actually a voter
    if (!voter.isVoter) {
      res.status(400).json({
        success: false,
        error: 'User is not a voter'
      });
      return;
    }

    // Check permissions based on role
    if (req.user?.role === 'franchise_admin' && voter.franchiseId?.toString() !== req.user.franchiseId?.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to update this voter'
      });
      return;
    }

    // Don't allow role changes to non-voter roles
    if (req.body.role && (req.body.role !== 'voter' || !req.body.isVoter)) {
      res.status(400).json({
        success: false,
        error: 'Cannot change role of voter to non-voter role'
      });
      return;
    }

    // Prevent password updates through this endpoint
    delete req.body.password;

    voter = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    res.status(200).json({
      success: true,
      data: voter
    });
  } catch (error) {
    console.error('Error updating voter:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Delete voter
 */
export const deleteVoter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voter = await User.findById(req.params.id);

    if (!voter) {
      res.status(404).json({
        success: false,
        error: 'Voter not found'
      });
      return;
    }

    // Check if user is actually a voter
    if (!voter.isVoter) {
      res.status(400).json({
        success: false,
        error: 'User is not a voter'
      });
      return;
    }

    // Check permissions based on role
    if (req.user?.role === 'franchise_admin' && voter.franchiseId?.toString() !== req.user.franchiseId?.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to delete this voter'
      });
      return;
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting voter:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Reset voter password
 */
export const resetVoterPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const voter = await User.findById(req.params.id);

    if (!voter) {
      res.status(404).json({
        success: false,
        error: 'Voter not found'
      });
      return;
    }

    // Check if user is actually a voter
    if (!voter.isVoter) {
      res.status(400).json({
        success: false,
        error: 'User is not a voter'
      });
      return;
    }

    // Check permissions based on role
    if (req.user?.role === 'franchise_admin' && voter.franchiseId?.toString() !== req.user.franchiseId?.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to reset password for this voter'
      });
      return;
    }

    // Create a new password or use the provided one
    let newPassword = req.body.password;
    if (!newPassword) {
      // Generate a password based on username and prefix
      const prefix = voter.prefix?.toLowerCase() || 'vote';
      newPassword = `${prefix}${voter.sequenceNumber || Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Update password
    voter.password = newPassword;
    await voter.save();

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successful',
        newPassword: newPassword
      }
    });
  } catch (error) {
    console.error('Error resetting voter password:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Get franchise administrators
 */
export const getFranchiseAdmins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const franchiseId = req.params.franchiseId;

    // Only super admins and franchise admins of this franchise can view
    if (req.user?.role !== 'super_admin' && 
        (req.user?.role !== 'franchise_admin' || req.user?.franchiseId?.toString() !== franchiseId)) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to view administrators for this franchise'
      });
      return;
    }

    const admins = await User.find({
      role: 'franchise_admin',
      franchiseId: franchiseId
    }).select('-password');

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error getting franchise admins:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Create franchise administrator
 */
export const createFranchiseAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, fullName, password, franchiseId } = req.body;

    // Validation
    if (!username || !password || !franchiseId) {
      res.status(400).json({
        success: false,
        error: 'Please provide all required fields (username, password, franchiseId)'
      });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
      return;
    }

    // Only super admins can create franchise admins
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to create franchise administrators'
      });
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the franchise admin
    const admin = new User({
      username,
      email,
      fullName,
      password: hashedPassword,
      franchiseId,
      role: 'franchise_admin',
      isVoter: false,
      createdBy: req.user.id,
      status: 'active'
    });

    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error creating franchise admin:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * Generate voters in bulk
 * Supports generating voters for individual elections or election groups
 */
export const generateVoters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Parse the request body data if needed
    let body = req.body;

    // Handle if body is a string (common JSON parsing error)
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        res.status(400).json({
          success: false,
          message: 'Invalid request data format'
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }
    }

    // Log the request body for debugging
    console.log('Voter generation request body:', body);

    // Extract with defaults
    const { 
      prefix = 'VOTE', 
      startingNumber = 1001, 
      count = 0, 
      electionIds = [], 
      electionGroupId = null,
      assignmentType = 'election'
    } = body;

    if (!count || count <= 0 || count > 1000) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid count between 1 and 1000'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Find the highest sequence number currently in use for the given prefix
    const highestUser = await User.findOne({ 
      prefix,
      isVoter: true
    }).sort({ sequenceNumber: -1 }).session(session);

    let nextStartingNumber = startingNumber;
    if (highestUser && highestUser.sequenceNumber && highestUser.sequenceNumber >= nextStartingNumber) {
      nextStartingNumber = highestUser.sequenceNumber + 1;
    }

    // Handle election group - get all elections in the group if using electionGroupId
    let electionsToAssign: mongoose.Types.ObjectId[] = [];
    let franchiseId: mongoose.Types.ObjectId | null = null;

    if (assignmentType === 'election' && electionIds && electionIds.length > 0) {
      // Convert all IDs to ObjectId
      electionsToAssign = electionIds.map((id: string) => new mongoose.Types.ObjectId(id));
    } else if (assignmentType === 'electionGroup' && electionGroupId) {
      const Election = mongoose.models.Election || mongoose.model('Election');
      const ElectionGroup = mongoose.models.ElectionGroup || mongoose.model('ElectionGroup');

      // Get the election group first to know the franchise
      const electionGroup = await ElectionGroup.findById(electionGroupId).session(session);
      if (!electionGroup) {
        res.status(404).json({
          success: false,
          message: 'Election group not found'
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }

      // Use franchise ID from the election group
      franchiseId = electionGroup.franchiseId;

      // Get all elections in this group
      const groupElections = await Election.find({ electionGroupId }).session(session);

      if (groupElections && groupElections.length > 0) {
        electionsToAssign = groupElections.map((election: any) => election._id);
      } else {
        res.status(404).json({
          success: false,
          message: 'No elections found in the selected election group'
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }
    }

    // If we still don't have a franchise ID and have elections, get it from the first election
    if (!franchiseId && electionsToAssign.length > 0) {
      try {
        const Election = mongoose.models.Election || mongoose.model('Election');
        const election = await Election.findById(electionsToAssign[0]).session(session);

        if (!election) {
          res.status(404).json({
            success: false,
            message: 'Election not found'
          });
          await session.abortTransaction();
          session.endSession();
          return;
        }

        franchiseId = election.franchiseId;
      } catch (error) {
        console.error('Error finding election:', error);
        res.status(500).json({
          success: false,
          message: 'Error processing election data'
        });
        await session.abortTransaction();
        session.endSession();
        return;
      }
    }

    // We must have a franchise ID by now
    if (!franchiseId) {
      res.status(400).json({
        success: false,
        message: 'Could not determine franchise for voter assignment'
      });
      await session.abortTransaction();
      session.endSession();
      return;
    }

    // Generate voters
    const voters = [];
    const generatedVoters = [];

    for (let i = 0; i < count; i++) {
      const sequenceNumber = nextStartingNumber + i;
      const username = `${prefix}${sequenceNumber.toString().padStart(4, '0')}`;
      const password = `${prefix.toLowerCase()}${sequenceNumber}`; // Simple password scheme

      // Create voter data object with all required fields
      const voterData: any = {
        username,
        password,
        role: 'voter',
        franchiseId,
        createdBy: req.user._id,
        status: 'active',
        isVoter: true,
        prefix,
        sequenceNumber
      };

      // Add election access if we have elections to assign
      if (electionsToAssign.length > 0) {
        voterData.electionAccess = electionsToAssign;
      }

      // No voter group assignment - we've simplified the process

      voters.push(voterData);
    }

    // Create voters in the database
    if (voters.length > 0) {
      const createdVoters = await User.create(voters, { session, ordered: true });

        // Prepare response data (exclude passwords)
        for (const voter of createdVoters) {
          generatedVoters.push({
            id: voter._id,
            username: voter.username,
            sequenceNumber: voter.sequenceNumber,
            prefix: voter.prefix
          });
        }

        // We've simplified the process and removed voter group dependency
      }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      count: generatedVoters.length,
      data: generatedVoters
    });
  } catch (error) {
    console.error('Error in generateVoters:', error);
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * Reset franchise administrator password
 * Securely updates the password for a franchise administrator
 */
export const resetFranchiseAdminPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
      return;
    }

    // Find the admin
    const admin = await User.findOne({
      _id: id,
      role: 'franchise_admin'
    });

    if (!admin) {
      res.status(404).json({
        success: false,
        error: 'Administrator not found'
      });
      return;
    }

    // Verify the user has permission to reset this admin's password
    // Super admins can reset any admin's password
    if (req.user?.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: 'Not authorized to reset administrator passwords'
      });
      return;
    }

    // Hash and update password with strong security
    const salt = await bcrypt.genSalt(12); // Increased rounds for better security
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password in database
    admin.password = hashedPassword;
    await admin.save();

    console.log(`Password reset successful for franchise admin ${admin.username}`);

    res.status(200).json({
      success: true,
      message: 'Administrator password reset successfully'
    });
  } catch (error) {
    console.error('Error resetting franchise admin password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.'
    });
  }
};

/**
 * Create election administrator
 */
export const createElectionAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, email, fullName, password, franchiseId, electionAccess } = req.body;

    // Validation
    if (!username || !password || !franchiseId || !electionAccess) {
      res.status(400).json({
        success: false,
        error: 'Please provide all required fields (username, password, franchiseId, electionAccess)'
      });
      return;
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
      return;
    }

    // Check if the user has permission to create admin for this franchise
    if (req.user?.role !== 'super_admin') {
      if (req.user?.role === 'franchise_admin' && req.user?.franchiseId?.toString() !== franchiseId) {
        res.status(403).json({
          success: false,
          error: 'Not authorized to create admin for this franchise'
        });
        return;
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the election admin
    const admin = new User({
      username,
      email,
      fullName,
      password: hashedPassword,
      franchiseId,
      electionAccess,
      role: 'election_admin',
      isVoter: false,
      createdBy: req.user.id,
      status: 'active'
    });

    await admin.save();

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      data: adminResponse
    });
  } catch (error) {
    console.error('Error creating election admin:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
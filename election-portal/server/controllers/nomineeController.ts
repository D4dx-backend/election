import { Request, Response, NextFunction } from 'express';
import Nominee from '../models/Nominee';
import Election from '../models/Election';
import mongoose from 'mongoose';

// Get all nominees
export const getAllNominees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let query;

    // Build query based on filters
    const { electionId, status, gender } = req.query;

    const queryObject: any = {};

    // Filter by election if provided
    if (electionId) {
      queryObject.electionId = electionId;
    }

    // Filter by status if provided
    if (status) {
      queryObject.status = status;
    }

    // Filter by gender if provided
    if (gender) {
      queryObject.gender = gender;
    }

    // Execute query
    query = Nominee.find(queryObject).sort({ position: 1, name: 1 });

    const nominees = await query;

    res.status(200).json({
      success: true,
      count: nominees.length,
      data: nominees
    });
  } catch (error) {
    next(error);
  }
};

// Get nominees for a specific election
export const getNomineesByElection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Get nominees for this election
    const nominees = await Nominee.find({ electionId }).sort({ position: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: nominees.length,
      data: nominees
    });
  } catch (error) {
    next(error);
  }
};

// Get single nominee by ID
export const getNominee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const nominee = await Nominee.findById(req.params.id);

    if (!nominee) {
      res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: nominee
    });
  } catch (error) {
    next(error);
  }
};

// Create new nominee
export const createNominee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verify election exists
    const election = await Election.findById(req.body.electionId);
    if (!election) {
      res.status(404).json({
        success: false,
        message: 'Election not found'
      });
      return;
    }

    // Check if max nominees limit is reached
    if (election.maxNominees) {
      const currentNomineesCount = await Nominee.countDocuments({ 
        electionId: req.body.electionId,
        status: 'active'
      });

      if (currentNomineesCount >= election.maxNominees) {
        res.status(400).json({
          success: false,
          message: `Maximum number of nominees (${election.maxNominees}) has been reached for this election`
        });
        return;
      }
    }

    // Create the nominee
    const nominee = await Nominee.create(req.body);

    res.status(201).json({
      success: true,
      data: nominee
    });
  } catch (error) {
    next(error);
  }
};

// Update nominee
export const updateNominee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const nominee = await Nominee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!nominee) {
      res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: nominee
    });
  } catch (error) {
    next(error);
  }
};

// Delete nominee
export const deleteNominee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const nominee = await Nominee.findById(req.params.id);

    if (!nominee) {
      res.status(404).json({
        success: false,
        message: 'Nominee not found'
      });
      return;
    }

    await nominee.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Create nominees in bulk
export const createBulkNominees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { nominees, electionId } = req.body;
    
    if (!nominees || !Array.isArray(nominees) || nominees.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Please provide nominees array'
      });
      return;
    }
    
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
    
    // Check if max nominees limit would be exceeded
    if (election.maxNominees) {
      const currentNomineesCount = await Nominee.countDocuments({ 
        electionId,
        status: 'active'
      }).session(session);
      
      if (currentNomineesCount + nominees.length > election.maxNominees) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          success: false,
          message: `Adding ${nominees.length} nominees would exceed the maximum limit of ${election.maxNominees} nominees for this election`
        });
        return;
      }
    }
    
    // Create all nominees
    const createdNominees = await Nominee.insertMany(
      nominees.map(nominee => ({
        ...nominee,
        electionId: nominee.electionId || electionId
      })),
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      success: true,
      count: createdNominees.length,
      message: `Successfully created ${createdNominees.length} nominees`,
      data: createdNominees
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error creating bulk nominees:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating bulk nominees'
    });
  }
};

// Import nominees from a previous election
export const importPreviousNominees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { sourceElectionId, targetElectionId } = req.body;
    
    if (!sourceElectionId || !targetElectionId) {
      res.status(400).json({
        success: false,
        message: 'Please provide source and target election IDs'
      });
      return;
    }
    
    // Verify both elections exist
    const [sourceElection, targetElection] = await Promise.all([
      Election.findById(sourceElectionId).session(session),
      Election.findById(targetElectionId).session(session)
    ]);
    
    if (!sourceElection) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        message: 'Source election not found'
      });
      return;
    }
    
    if (!targetElection) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        message: 'Target election not found'
      });
      return;
    }
    
    // Get nominees from source election
    const sourceNominees = await Nominee.find({ 
      electionId: sourceElectionId,
      status: 'active'
    }).session(session);
    
    if (sourceNominees.length === 0) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        message: 'No active nominees found in the source election'
      });
      return;
    }
    
    // Check if max nominees limit would be exceeded
    if (targetElection.maxNominees) {
      const currentNomineesCount = await Nominee.countDocuments({ 
        electionId: targetElectionId,
        status: 'active'
      }).session(session);
      
      if (currentNomineesCount + sourceNominees.length > targetElection.maxNominees) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({
          success: false,
          message: `Importing ${sourceNominees.length} nominees would exceed the maximum limit of ${targetElection.maxNominees} nominees for the target election`
        });
        return;
      }
    }
    
    // Create new nominees in the target election
    const newNominees = sourceNominees.map(nominee => {
      const nomineeObj = nominee.toObject();
      delete nomineeObj._id;
      return {
        ...nomineeObj,
        electionId: targetElectionId
      };
    });
    
    const createdNominees = await Nominee.insertMany(newNominees, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      success: true,
      count: createdNominees.length,
      message: `Successfully imported ${createdNominees.length} nominees from election ${sourceElectionId}`,
      data: createdNominees
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error importing nominees:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error importing nominees'
    });
  }
};
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

/**
 * Generate JWT token for authenticated users
 */
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password, email, fullName, role = 'voter' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Username already exists' });
      return;
    }

    // Create new user
    const user = await User.create({
      username,
      password, // Will be hashed by the pre-save hook
      email,
      fullName,
      role,
      createdBy: req.user?.id, // If a user is authenticated (admin creating another user)
      status: 'active',
      isVoter: role === 'voter'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.fullName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login a user - Complete rewrite with more detailed logging and handling for all user types
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Please provide username and password' });
      return;
    }

    console.log(`Login attempt for username: "${username}"`);
    
    try {
      // Advanced username search - try different methods to find the user
      let user = null;
      
      // Method 1: Direct exact match using MongoDB driver
      const userCollection = User.collection;
      user = await userCollection.findOne({ username: username });
      
      // Method 2: If not found, try case-insensitive search
      if (!user) {
        console.log(`User not found with exact match, trying case-insensitive search for: "${username}"`);
        user = await userCollection.findOne({ 
          username: { $regex: new RegExp(`^${username}$`, 'i') } 
        });
      }
      
      // Method 3: If still not found, use Mongoose model with full password select
      if (!user) {
        console.log(`User still not found, trying Mongoose model for: "${username}"`);
        const mongooseUser = await User.findOne({ username: username }).select('+password');
        if (mongooseUser) {
          user = mongooseUser.toObject();
        }
      }
      
      // No user found with any method
      if (!user) {
        console.log(`User not found with any method: "${username}"`);
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      
      console.log(`User found: "${user.username}", Role: ${user.role}`);
      console.log(`Password exists: ${!!user.password}, Length: ${user.password?.length || 0}`);
      
      // Check if password exists
      if (!user.password) {
        console.log("Password missing in database");
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      
      // Use imported bcrypt for password comparison
      let isMatch = false;
      
      try {
        isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password comparison result: ${isMatch}`);
      } catch (bcryptError) {
        console.error("Error comparing passwords:", bcryptError);
        res.status(500).json({ success: false, message: 'Error during authentication' });
        return;
      }
      
      // Method 3: Last resort - direct string comparison for plaintext passwords (temporary for testing only)
      if (!isMatch && process.env.NODE_ENV !== 'production') {
        isMatch = (password === user.password);
        console.log(`Direct string comparison (testing only): ${isMatch}`);
      }
      
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }
      
      // Authentication successful - Update last login timestamp
      try {
        await userCollection.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        );
        console.log("Updated last login time");
      } catch (updateError) {
        console.error("Non-critical error updating last login:", updateError);
        // Continue anyway since this is non-critical
      }
      
      // Generate JWT token - ensure we have a string ID
      const userId = typeof user._id === 'object' && user._id !== null 
        ? user._id.toString() 
        : String(user._id);
      
      const token = generateToken(userId);
      
      // Prepare user data for response - safely handle all fields
      const userData = {
        id: userId,
        username: user.username || '',
        role: user.role || 'voter',
        email: user.email || undefined,
        fullName: user.fullName || undefined,
        // Handle franchiseId which could be an ObjectId or string
        franchiseId: user.franchiseId 
          ? (typeof user.franchiseId === 'object' && user.franchiseId !== null && user.franchiseId.toString)
            ? user.franchiseId.toString()
            : String(user.franchiseId)
          : undefined,
        // Handle electionAccess array carefully
        electionAccess: Array.isArray(user.electionAccess) 
          ? user.electionAccess.map(id => 
              typeof id === 'object' && id !== null && id.toString ? id.toString() : String(id)
            ) 
          : undefined,
        // Include status if available
        status: user.status || 'active'
      };
      
      console.log(`Login successful for: ${user.username}, Role: ${user.role}`);
      
      // Return success response with user data
      res.status(200).json({
        success: true,
        token,
        user: userData
      });
    } catch (dbError) {
      console.error("Database error during login:", dbError);
      res.status(500).json({ success: false, message: 'Database error during authentication' });
    }
  } catch (error) {
    console.error("Unexpected error in login:", error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred' });
  }
};

/**
 * Get current user details
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        franchiseId: user.franchiseId,
        electionAccess: user.electionAccess,
        status: user.status,
        isVoter: user.isVoter
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create initial super admin user if it doesn't exist
 */
export const createSuperAdmin = async (): Promise<void> => {
  try {
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ username: 'admin' });
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      
      // Update password to ensure it's correct (if needed)
      if (!(await existingSuperAdmin.comparePassword('admin123'))) {
        existingSuperAdmin.password = 'admin123';
        await existingSuperAdmin.save();
        console.log('Super admin password updated');
      }
      return;
    }

    // Create super admin with specified credentials
    const superAdmin = new User({
      username: 'admin',
      password: 'admin123', // Will be hashed by the pre-save hook
      email: 'admin@electionapp.com',
      fullName: 'System Administrator',
      role: 'super_admin',
      status: 'active',
      isVoter: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await superAdmin.save();
    console.log('Super admin created successfully');
  } catch (error) {
    console.error('Error creating super admin:', error);
  }
};

/**
 * Middleware to protect routes - verify token and add user to request
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token;

    // Check if token is in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Or check if token is in cookies
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized to access this route' });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      
      // Attach user to request
      const user = await User.findById(decoded.id);
      if (!user) {
        res.status(401).json({ success: false, message: 'User no longer exists' });
        return;
      }

      // Add user to request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ success: false, message: 'Not authorized to access this route' });
      return;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to authorize roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
      return;
    }

    next();
  };
};

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
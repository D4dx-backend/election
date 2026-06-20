import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// Define the user interface
export interface IUser extends Document {
  username: string;
  password: string;
  email?: string;
  fullName?: string;
  role: 'super_admin' | 'franchise_admin' | 'election_admin' | 'voter';
  franchiseId?: mongoose.Types.ObjectId;
  registrationNumber?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  status: 'active' | 'inactive';
  electionAccess?: mongoose.Types.ObjectId[];
  isVoter: boolean;
  prefix?: string;
  sequenceNumber?: number;
  onboardingCompleted?: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create the user schema
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allow null values to still enforce uniqueness on non-null values
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'franchise_admin', 'election_admin', 'voter'],
    required: true
  },
  franchiseId: {
    type: Schema.Types.ObjectId,
    ref: 'Franchise'
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLogin: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  electionAccess: [{
    type: Schema.Types.ObjectId,
    ref: 'Election'
  }],
  isVoter: {
    type: Boolean,
    default: false
  },
  prefix: {
    type: String
  },
  sequenceNumber: {
    type: Number
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare passwords for authentication
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    if (!candidatePassword || !this.password) {
      console.error('Missing password data for comparison');
      return false;
    }
    
    // Use direct bcrypt compare for more reliable authentication
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
};

// Create and export the User model
export default mongoose.model<IUser>('User', UserSchema);
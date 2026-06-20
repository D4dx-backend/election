import mongoose, { Document, Schema } from 'mongoose';

// Define the election interface
export interface IElection extends Document {
  franchiseId: mongoose.Types.ObjectId;
  organization: string;
  title: string;
  electionDate: Date;
  numberToBeElected: number;
  nomineeDisplayOrder: string;
  maxVoters?: number;
  maxNominees?: number;
  maleMinimum?: number;
  femaleMinimum?: number;
  selfRegOpen: boolean;
  votingOpen: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'active' | 'completed' | 'archived';
  logo?: {
    url?: string;
    alt?: string;
  };
  electionGroupId?: mongoose.Types.ObjectId;
}

// Create the election schema
const ElectionSchema: Schema = new Schema({
  franchiseId: {
    type: Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
  },
  organization: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  electionDate: {
    type: Date,
    required: true
  },
  numberToBeElected: {
    type: Number,
    required: true,
    min: 1
  },
  nomineeDisplayOrder: {
    type: String,
    default: 'ALPHA'
  },
  maxVoters: {
    type: Number
  },
  maxNominees: {
    type: Number
  },
  maleMinimum: {
    type: Number
  },
  femaleMinimum: {
    type: Number
  },
  selfRegOpen: {
    type: Boolean,
    default: false
  },
  votingOpen: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  logo: {
    url: {
      type: String
    },
    alt: {
      type: String
    }
  },
  electionGroupId: {
    type: Schema.Types.ObjectId,
    ref: 'ElectionGroup'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Create and export the Election model
export default mongoose.model<IElection>('Election', ElectionSchema);
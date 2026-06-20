import mongoose, { Document, Schema } from 'mongoose';

// Define the franchise interface
export interface IFranchise extends Document {
  name: string;
  logo: {
    url?: string;
    alt?: string;
  };
  websiteUrl?: string;
  contactNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
  defaultNomineeDisplayOrder: string;
  defaultMaxVoters?: number;
  defaultMaxNominees?: number;
  defaultMaleMinimum?: number;
  defaultFemaleMinimum?: number;
  defaultSelfRegOpen: boolean;
  defaultVotingOpen: boolean;
}

// Create the franchise schema
const FranchiseSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    url: {
      type: String
    },
    alt: {
      type: String
    }
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  contactNumber: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  defaultNomineeDisplayOrder: {
    type: String,
    default: 'ALPHA'
  },
  defaultMaxVoters: {
    type: Number
  },
  defaultMaxNominees: {
    type: Number
  },
  defaultMaleMinimum: {
    type: Number
  },
  defaultFemaleMinimum: {
    type: Number
  },
  defaultSelfRegOpen: {
    type: Boolean,
    default: false
  },
  defaultVotingOpen: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Create and export the Franchise model
export default mongoose.model<IFranchise>('Franchise', FranchiseSchema);
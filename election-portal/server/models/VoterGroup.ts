import mongoose, { Document, Schema } from 'mongoose';

// Define the voter group interface
export interface IVoterGroup extends Document {
  franchiseId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  prefix?: string;
  startingNumber?: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the voter group schema
const VoterGroupSchema: Schema = new Schema({
  franchiseId: {
    type: Schema.Types.ObjectId,
    ref: 'Franchise',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  prefix: {
    type: String,
    trim: true
  },
  startingNumber: {
    type: Number,
    min: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Create and export the VoterGroup model
export default mongoose.model<IVoterGroup>('VoterGroup', VoterGroupSchema);
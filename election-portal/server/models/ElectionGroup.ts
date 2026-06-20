import mongoose, { Document, Schema } from 'mongoose';

// Define the election group interface
export interface IElectionGroup extends Document {
  franchiseId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the election group schema
const ElectionGroupSchema: Schema = new Schema({
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
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Create and export the ElectionGroup model
export default mongoose.model<IElectionGroup>('ElectionGroup', ElectionGroupSchema);
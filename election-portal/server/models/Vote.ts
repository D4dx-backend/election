import mongoose, { Document, Schema } from 'mongoose';

// Define the vote interface
export interface IVote extends Document {
  electionId: mongoose.Types.ObjectId;
  voterId: mongoose.Types.ObjectId;
  nominees: mongoose.Types.ObjectId[];
  timestamp: Date;
  ipAddress?: string;
  deviceInfo?: string;
  status: 'completed' | 'partial' | 'rejected';
}

// Create the vote schema
const VoteSchema: Schema = new Schema({
  electionId: {
    type: Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  voterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  nominees: [{
    type: Schema.Types.ObjectId,
    ref: 'Nominee',
    required: true
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String
  },
  deviceInfo: {
    type: String
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'rejected'],
    default: 'completed'
  }
});

// Create a compound index to prevent duplicate votes
VoteSchema.index({ electionId: 1, voterId: 1 }, { unique: true });

// Create and export the Vote model
export default mongoose.model<IVote>('Vote', VoteSchema);
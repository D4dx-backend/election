import mongoose, { Document, Schema } from 'mongoose';

// Define the nominee result interface for analytics
interface NomineeResult {
  nomineeId: mongoose.Types.ObjectId;
  nomineeName: string;
  voteCount: number;
  percentage: number;
}

// Define the election analytics interface
export interface IElectionAnalytics extends Document {
  electionId: mongoose.Types.ObjectId;
  totalVoters: number;
  totalVotesCast: number;
  pendingVoters: number;
  nomineeResults: NomineeResult[];
  lastUpdated: Date;
  isFinalized: boolean;
}

// Create the election analytics schema
const ElectionAnalyticsSchema: Schema = new Schema({
  electionId: {
    type: Schema.Types.ObjectId,
    ref: 'Election',
    required: true,
    unique: true
  },
  totalVoters: {
    type: Number,
    default: 0
  },
  totalVotesCast: {
    type: Number,
    default: 0
  },
  pendingVoters: {
    type: Number,
    default: 0
  },
  nomineeResults: [{
    nomineeId: {
      type: Schema.Types.ObjectId,
      ref: 'Nominee'
    },
    nomineeName: String,
    voteCount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isFinalized: {
    type: Boolean,
    default: false
  }
});

// Create and export the ElectionAnalytics model
export default mongoose.model<IElectionAnalytics>('ElectionAnalytics', ElectionAnalyticsSchema);
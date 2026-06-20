import mongoose, { Document, Schema } from 'mongoose';

// Define the nominee interface
export interface INominee extends Document {
  electionId: mongoose.Types.ObjectId;
  name: string;
  gender: 'male' | 'female' | 'other';
  position?: number;
  photo?: {
    url?: string;
    alt?: string;
  };
  bio?: string;
  additionalInfo?: any;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'withdrawn' | 'disqualified';
}

// Create the nominee schema
const NomineeSchema: Schema = new Schema({
  electionId: {
    type: Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  position: {
    type: Number
  },
  photo: {
    url: {
      type: String
    },
    alt: {
      type: String
    }
  },
  bio: {
    type: String
  },
  additionalInfo: {
    type: Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['active', 'withdrawn', 'disqualified'],
    default: 'active'
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Create and export the Nominee model
export default mongoose.model<INominee>('Nominee', NomineeSchema);
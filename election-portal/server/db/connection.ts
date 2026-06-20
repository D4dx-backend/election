import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createSuperAdmin } from '../controllers/authController';

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGO_URI = process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/[^/]*$/, '/electionapp') : '';

// Connect to MongoDB
export const connectDB = async (): Promise<void> => {
  try {
    if (!MONGO_URI) {
      throw new Error('MongoDB connection string is not provided. Please set MONGO_URI environment variable.');
    }

    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected');
    
    // Create super admin user after successful connection
    await createSuperAdmin();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Close MongoDB connection when the Node process terminates
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed due to app termination');
  process.exit(0);
});
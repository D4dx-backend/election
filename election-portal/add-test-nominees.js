// Add test nominees to an election in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define Nominee schema (must match your existing schema)
const nomineeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female']
  },
  position: {
    type: Number
  },
  bio: String,
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Election'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create Nominee model
const Nominee = mongoose.model('Nominee', nomineeSchema);

// The election ID to add nominees to
const electionId = '6831438a339fd34223327444';

// Sample nominees data
const testNominees = [
  {
    name: 'John Smith',
    gender: 'male',
    position: 1,
    bio: 'Experienced leader with a focus on community development.',
    electionId,
    status: 'active'
  },
  {
    name: 'Sarah Johnson',
    gender: 'female',
    position: 2,
    bio: 'Advocate for education reform and youth programs.',
    electionId,
    status: 'active'
  },
  {
    name: 'Michael Wong',
    gender: 'male',
    position: 3,
    bio: 'Financial expert committed to transparent budgeting.',
    electionId,
    status: 'active'
  },
  {
    name: 'Priya Patel',
    gender: 'female',
    position: 4,
    bio: 'Community organizer with extensive volunteer experience.',
    electionId,
    status: 'active'
  },
  {
    name: 'David Chen',
    gender: 'male',
    position: 5,
    bio: 'Technology specialist focused on digital innovation.',
    electionId,
    status: 'active'
  }
];

// Add nominees to the database
async function addTestNominees() {
  try {
    // Check if nominees already exist for this election
    const existingNominees = await Nominee.find({ electionId });
    
    if (existingNominees.length > 0) {
      console.log(`This election already has ${existingNominees.length} nominees:`);
      existingNominees.forEach(nominee => {
        console.log(`- ${nominee.name} (${nominee.gender})`);
      });
    } else {
      // Insert the nominees
      const result = await Nominee.insertMany(testNominees);
      console.log(`Successfully added ${result.length} nominees to the election.`);
      result.forEach(nominee => {
        console.log(`- ${nominee.name} (${nominee.gender})`);
      });
    }
    
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error adding nominees:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Execute the function
addTestNominees();
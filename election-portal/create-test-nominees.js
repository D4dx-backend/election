// Script to create test nominees for an election
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/electionManagement')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Import the Nominee model
const Nominee = require('./server/models/Nominee');

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

async function createTestNominees() {
  try {
    // First, check if we already have nominees for this election
    const existingNominees = await Nominee.find({ electionId });
    
    if (existingNominees.length > 0) {
      console.log(`This election already has ${existingNominees.length} nominees. No need to add more.`);
      existingNominees.forEach(nominee => {
        console.log(`- ${nominee.name} (${nominee.gender})`);
      });
      process.exit(0);
    }
    
    // Create the nominees
    const createdNominees = await Nominee.insertMany(testNominees);
    
    console.log(`Successfully created ${createdNominees.length} test nominees:`);
    createdNominees.forEach(nominee => {
      console.log(`- ${nominee.name} (${nominee.gender})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test nominees:', error);
    process.exit(1);
  }
}

// Run the function
createTestNominees();
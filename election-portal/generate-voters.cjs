const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function generateVoters() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Define schemas for our models
    const voterGroupSchema = new mongoose.Schema({}, { 
      collection: 'votergroups', 
      strict: false 
    });
    
    const userSchema = new mongoose.Schema({}, { 
      collection: 'users', 
      strict: false 
    });
    
    // Register models
    const VoterGroup = mongoose.models.VoterGroup || mongoose.model('VoterGroup', voterGroupSchema);
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Fetch the voter group we just created
    const voterGroup = await VoterGroup.findOne({ name: 'Default Voters' });
    
    if (!voterGroup) {
      console.log('Voter group not found. Please create it first.');
      return;
    }
    
    console.log('Found voter group:', {
      id: voterGroup._id,
      name: voterGroup.name,
      prefix: voterGroup.prefix,
      startingNumber: voterGroup.startingNumber
    });
    
    // Get highest sequence number currently in use
    const highestUser = await User.findOne({ 
      prefix: voterGroup.prefix,
      isVoter: true
    }).sort({ sequenceNumber: -1 });
    
    let startingNumber = voterGroup.startingNumber;
    if (highestUser && highestUser.sequenceNumber && highestUser.sequenceNumber >= startingNumber) {
      startingNumber = highestUser.sequenceNumber + 1;
    }
    
    console.log('Starting sequence number:', startingNumber);
    
    // Number of voters to generate
    const numberOfVoters = 20;
    
    // Prepare voters array
    const voters = [];
    for (let i = 0; i < numberOfVoters; i++) {
      const sequenceNumber = startingNumber + i;
      const username = `${voterGroup.prefix}${sequenceNumber.toString().padStart(4, '0')}`;
      const plainPassword = `${voterGroup.prefix.toLowerCase()}${sequenceNumber}`;
      const password = await bcrypt.hash(plainPassword, 10);
      
      voters.push({
        username,
        password,
        role: 'voter',
        franchiseId: voterGroup.franchiseId,
        status: 'active',
        isVoter: true,
        prefix: voterGroup.prefix,
        sequenceNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Insert voters into database
    const result = await User.insertMany(voters);
    
    console.log(`Successfully generated ${result.length} voters`);
    console.log('\nFirst 5 voters:');
    
    for (let i = 0; i < Math.min(5, result.length); i++) {
      const plainPassword = `${voterGroup.prefix.toLowerCase()}${startingNumber + i}`;
      console.log({
        username: result[i].username,
        password: plainPassword, // Only showing for demonstration
        id: result[i]._id
      });
    }
    
    // Update the starting number in the voter group
    voterGroup.startingNumber = startingNumber + numberOfVoters;
    await voterGroup.save();
    
    console.log(`\nUpdated voter group starting number to: ${voterGroup.startingNumber}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

generateVoters();
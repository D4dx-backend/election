const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

async function createVoterGroup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Create a simple schema for the voter group
    const voterGroupSchema = new mongoose.Schema({
      name: String,
      description: String,
      franchiseId: mongoose.Schema.Types.ObjectId,
      prefix: String,
      startingNumber: Number,
      createdBy: mongoose.Schema.Types.ObjectId,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }, { 
      collection: 'votergroups', 
      strict: false 
    });
    
    // Create the model
    const VoterGroup = mongoose.models.VoterGroup || mongoose.model('VoterGroup', voterGroupSchema);
    
    // Get all available franchises
    const franchiseSchema = new mongoose.Schema({}, { 
      collection: 'franchises', 
      strict: false 
    });
    const Franchise = mongoose.models.Franchise || mongoose.model('Franchise', franchiseSchema);
    
    // Find a franchise to associate the voter group with
    const franchise = await Franchise.findOne({});
    
    if (!franchise) {
      console.log('No franchise found. Please create a franchise first.');
      return;
    }
    
    console.log('Found franchise:', {
      id: franchise._id,
      name: franchise.name
    });
    
    // Find super admin for createdBy reference
    const userSchema = new mongoose.Schema({}, { 
      collection: 'users', 
      strict: false 
    });
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.log('No super admin found.');
      return;
    }
    
    // Create voter group
    const voterGroup = new VoterGroup({
      name: 'Default Voters',
      description: 'Default voter group for all elections',
      franchiseId: franchise._id,
      prefix: 'VOTE',
      startingNumber: 1001,
      createdBy: superAdmin._id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await voterGroup.save();
    
    console.log('Voter group created successfully:', {
      id: voterGroup._id,
      name: voterGroup.name,
      prefix: voterGroup.prefix,
      franchiseId: voterGroup.franchiseId
    });
    
    // Get all elections for this franchise
    const electionSchema = new mongoose.Schema({}, { 
      collection: 'elections', 
      strict: false 
    });
    const Election = mongoose.models.Election || mongoose.model('Election', electionSchema);
    
    const elections = await Election.find({ franchiseId: franchise._id });
    
    console.log(`Found ${elections.length} elections associated with this franchise.`);
    if (elections.length > 0) {
      console.log('Example election ID to use for voter generation:');
      console.log('- Election ID:', elections[0]._id);
    }
    
    console.log('\nTo generate voters, use the following parameters:');
    console.log('- Voter Group ID:', voterGroup._id);
    console.log('- Prefix:', voterGroup.prefix);
    console.log('- Starting Number:', voterGroup.startingNumber);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createVoterGroup();
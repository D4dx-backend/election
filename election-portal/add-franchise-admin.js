import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Function to add a franchise admin user
async function addFranchiseAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB:', process.env.MONGO_URI);
    
    // Create User schema directly with minimal structure
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true },
      password: { type: String, required: true },
      email: String,
      fullName: String,
      role: String,
      franchiseId: mongoose.Schema.Types.ObjectId,
      isVoter: Boolean,
      status: String,
      onboardingCompleted: Boolean
    }, { strict: false, collection: 'users' });
    
    // Create User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Find a franchise to associate with the admin
    const franchiseSchema = new mongoose.Schema({}, { strict: false, collection: 'franchises' });
    const Franchise = mongoose.models.Franchise || mongoose.model('Franchise', franchiseSchema);
    
    const franchise = await Franchise.findOne();
    if (!franchise) {
      console.log('No franchise found in the database.');
      return;
    }
    
    console.log('Found franchise with ID:', franchise._id);
    
    // Create a hash for the password
    const hashedPassword = await bcrypt.hash('123456', 10);
    console.log('Created password hash');
    
    // Check if user shameer already exists
    const existingUser = await User.findOne({ username: 'shameer' });
    
    if (existingUser) {
      console.log('User shameer already exists, updating credentials...');
      existingUser.password = hashedPassword;
      existingUser.role = 'franchise_admin';
      existingUser.franchiseId = franchise._id;
      existingUser.status = 'active';
      existingUser.onboardingCompleted = true;
      await existingUser.save();
      console.log('User shameer updated successfully');
    } else {
      // Create a new franchise admin user
      const franchiseAdmin = new User({
        username: 'shameer',
        password: hashedPassword,
        email: 'shameer@example.com',
        fullName: 'Shameer Admin',
        role: 'franchise_admin',
        franchiseId: franchise._id,
        isVoter: false,
        status: 'active',
        onboardingCompleted: true
      });
      
      await franchiseAdmin.save();
      console.log('Franchise admin "shameer" created successfully');
    }
    
    // Show login instructions
    console.log('\nYou can now log in with:');
    console.log('Username: shameer');
    console.log('Password: 123456');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Execute the function
addFranchiseAdmin();
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    // Define a simple user schema
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      email: String,
      fullName: String,
      role: { 
        type: String, 
        enum: ['super_admin', 'franchise_admin', 'election_admin', 'voter'] 
      },
      franchiseId: mongoose.Schema.Types.ObjectId,
      isVoter: Boolean,
      status: String,
      onboardingCompleted: Boolean
    });
    
    // Create the User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Create a direct password hash (not using pre-save hooks)
    const hashPassword = await bcrypt.hash('admin123', 10);
    console.log('Generated hash:', hashPassword);
    
    // Create super admin if not exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('Super admin exists, updating password');
      existingAdmin.password = hashPassword;
      await existingAdmin.save();
      console.log('Super admin password updated');
    } else {
      const newAdmin = new User({
        username: 'admin',
        password: hashPassword,
        email: 'admin@example.com',
        fullName: 'Super Admin',
        role: 'super_admin',
        isVoter: false,
        status: 'active',
        onboardingCompleted: true
      });
      
      await newAdmin.save();
      console.log('Super admin created successfully');
    }
    
    // Find a franchise
    // Using a different collection name since we don't know what it is exactly
    const franchiseSchema = new mongoose.Schema({}, { strict: false });
    const Franchise = mongoose.models.Franchise || mongoose.model('Franchise', franchiseSchema);
    
    const franchise = await Franchise.findOne();
    if (!franchise) {
      console.log('No franchise found, skipping franchise admin creation');
    } else {
      console.log('Found franchise with ID:', franchise._id);
      
      // Create franchise admin if not exists
      const existingFranchiseAdmin = await User.findOne({ username: 'fadmin' });
      
      if (existingFranchiseAdmin) {
        console.log('Franchise admin exists, updating password and franchise ID');
        existingFranchiseAdmin.password = hashPassword;
        existingFranchiseAdmin.franchiseId = franchise._id;
        await existingFranchiseAdmin.save();
        console.log('Franchise admin updated');
      } else {
        const newFranchiseAdmin = new User({
          username: 'fadmin',
          password: hashPassword,
          email: 'fadmin@example.com',
          fullName: 'Franchise Admin',
          role: 'franchise_admin',
          franchiseId: franchise._id,
          isVoter: false,
          status: 'active',
          onboardingCompleted: true
        });
        
        await newFranchiseAdmin.save();
        console.log('Franchise admin created successfully');
      }
    }
    
    console.log('Admin users processed successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

createAdminUsers();
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

// Dynamically import the User schema
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTestAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    // Dynamically load the User model
    const modelsPath = join(__dirname, 'server', 'models', 'User.js');
    
    if (!fs.existsSync(modelsPath)) {
      console.log('User model not found at:', modelsPath);
      // Try alternative path
      const alternativePath = join(__dirname, 'server', 'models', 'User.ts');
      if (fs.existsSync(alternativePath)) {
        console.log('Found User model at:', alternativePath);
      } else {
        throw new Error('User model not found');
      }
    }
    
    // Define User schema if we can't import it
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true, select: false },
      email: { type: String },
      fullName: { type: String },
      role: { 
        type: String, 
        enum: ['super_admin', 'franchise_admin', 'election_admin', 'voter'],
        required: true
      },
      franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
      isVoter: { type: Boolean, default: false },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      onboardingCompleted: { type: Boolean, default: false }
    });
    
    // Add password comparison method
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    };
    
    // Create the User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Create a test franchise admin user
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // First check if user already exists
    const existingUser = await User.findOne({ username: 'franchiseadmin' });
    
    if (existingUser) {
      console.log('User already exists, updating password');
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log(`Password updated for user: franchiseadmin`);
    } else {
      // Create a new user
      const newUser = new User({
        username: 'franchiseadmin',
        password: hashedPassword,
        email: 'franchiseadmin@test.com',
        fullName: 'Franchise Admin',
        role: 'franchise_admin',
        franchiseId: '68311e7599f23ecec939a609', // Use an existing franchise ID
        isVoter: false,
        status: 'active',
        onboardingCompleted: true
      });
      
      await newUser.save();
      console.log('Test franchise admin created successfully');
    }
    
    // Also create a super admin if not exists
    const existingSuperAdmin = await User.findOne({ username: 'admin' });
    
    if (!existingSuperAdmin) {
      const superAdminPassword = await bcrypt.hash('admin123', 10);
      const superAdmin = new User({
        username: 'admin',
        password: superAdminPassword,
        email: 'admin@test.com',
        fullName: 'Super Admin',
        role: 'super_admin',
        isVoter: false,
        status: 'active',
        onboardingCompleted: true
      });
      
      await superAdmin.save();
      console.log('Super admin created successfully');
    } else {
      console.log('Super admin already exists');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  }
}

createTestAdmin();
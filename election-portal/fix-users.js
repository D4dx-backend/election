import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function fixUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Define a simple User schema without strict mode
    const userSchema = new mongoose.Schema({}, { 
      collection: 'users', 
      strict: false 
    });
    
    // Register the model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Find the user we want to fix
    const user = await User.findOne({ username: 'shameer' });
    
    if (!user) {
      console.log('User shameer not found');
      return;
    }
    
    console.log('Found user:', {
      id: user._id,
      username: user.username,
      role: user.role,
    });
    
    // Apply fixes to the user
    // 1. Reset the password
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user record directly
    user.password = hashedPassword;
    user.status = 'active';
    
    // Save user with changes
    await user.save();
    
    console.log('User updated with new password:', {
      username: user.username,
      password: 'password123', // Just for display - actual hashed password stored
      hashedPasswordSample: hashedPassword.substring(0, 15) + '...',
      status: user.status
    });
    
    // Verify password update worked
    const verificationResult = await bcrypt.compare(password, user.password);
    console.log('Password verification check:', verificationResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixUsers();
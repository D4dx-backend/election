const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

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
    // 1. Reset the password - use a simple password without complex characters
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user record directly with raw queries to avoid model validation/hooks
    await mongoose.connection.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          status: 'active'
        } 
      }
    );
    
    console.log('User updated with new password:', {
      username: user.username,
      password: password, // Just for display - actual hashed password stored
      hashedPasswordSample: hashedPassword.substring(0, 15) + '...',
      status: 'active'
    });
    
    // Verify password update worked - retrieve fresh user record
    const updatedUser = await User.findOne({ username: 'shameer' });
    const verificationResult = await bcrypt.compare(password, updatedUser.password);
    console.log('Password verification check:', verificationResult);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixUsers();
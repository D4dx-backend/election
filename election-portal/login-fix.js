const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// Generate JWT token function
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Function to simulate the login process
async function simulateLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Create a simple schema for the User model
    const userSchema = new mongoose.Schema({}, { 
      collection: 'users', 
      strict: false 
    });
    
    // Get or create the User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Test credentials
    const testUsername = 'shameer';
    const testPassword = 'shameer123';
    
    console.log(`Testing login with: ${testUsername} / ${testPassword}`);
    
    // Find the user
    const user = await User.findOne({ username: testUsername });
    
    if (!user) {
      console.log('Login failed: User not found');
      return;
    }
    
    console.log('User found:', {
      id: user._id,
      username: user.username,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });
    
    // Verify password
    try {
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('Login failed: Invalid password');
        return;
      }
    } catch (error) {
      console.error('Error comparing passwords:', error.message);
      return;
    }
    
    // Generate token
    const token = generateToken(user._id.toString());
    console.log('Generated token (first 20 chars):', token.substring(0, 20) + '...');
    
    // Prepare the user data for response
    const userData = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      franchiseId: user.franchiseId ? user.franchiseId.toString() : null
    };
    
    console.log('Login successful!');
    console.log('User data for response:', userData);
    
    // ----- IMPORTANT: Find out why login is failing in the main API -----
    // Verify that our database connection is using the same password format
    console.log('\nDiagnostic Tests:');
    
    // 1. Check if bcrypt can verify the password directly
    const directMatch = await bcrypt.compare(testPassword, user.password);
    console.log('1. Direct bcrypt comparison:', directMatch);
    
    // 2. Try creating a fresh hash and comparing with that
    const freshHash = await bcrypt.hash(testPassword, 10);
    console.log('2. Fresh hash created:', freshHash.substring(0, 15) + '...');
    
    // 3. Test if the model save operation might be affecting the hash
    user.lastLogin = new Date();
    await user.save();
    console.log('3. Updated lastLogin, checking if password is still valid after save');
    
    const savedUser = await User.findOne({ username: testUsername });
    const stillValid = await bcrypt.compare(testPassword, savedUser.password);
    console.log('   Password still valid after save:', stillValid);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the simulation
simulateLogin();
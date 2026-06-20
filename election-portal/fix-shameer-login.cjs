const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixShameerLogin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find shameer user
    const shameerUser = await mongoose.connection.db.collection('users').findOne({
      username: 'shameer'
    });

    if (shameerUser) {
      console.log('Found user shameer!');
      console.log(`User ID: ${shameerUser._id}`);
      console.log(`Role: ${shameerUser.role}`);
      console.log(`Status: ${shameerUser.status}`);
      console.log(`Current password hash: ${shameerUser.password}`);
      
      // Create a new password hash
      const password = 'simple123';
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Update the user with the new password
      await mongoose.connection.db.collection('users').updateOne(
        { _id: shameerUser._id },
        { 
          $set: { 
            password: passwordHash,
            status: 'active' 
          } 
        }
      );
      
      console.log('Updated shameer user with new password hash');
      console.log(`New password: ${password}`);
      
      // Verify the update
      const updatedUser = await mongoose.connection.db.collection('users').findOne({
        _id: shameerUser._id
      });
      
      console.log(`Updated user status: ${updatedUser.status}`);
      console.log(`Updated password hash: ${updatedUser.password}`);
      
      // Test password verification
      const isPasswordCorrect = await bcrypt.compare(password, updatedUser.password);
      console.log(`Password verification result: ${isPasswordCorrect ? 'SUCCESS' : 'FAILED'}`);
    } else {
      console.log('User shameer not found! Creating a new user...');
      
      // Create a new user if not found
      const password = 'simple123';
      const passwordHash = await bcrypt.hash(password, 10);
      
      const newUser = {
        username: 'shameer',
        password: passwordHash,
        role: 'franchise_admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        isVoter: false
      };
      
      const result = await mongoose.connection.db.collection('users').insertOne(newUser);
      console.log(`Created new shameer user with ID: ${result.insertedId}`);
      console.log(`Password: ${password}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixShameerLogin();
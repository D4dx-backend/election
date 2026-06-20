const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function resetPasswords() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Reset franchise admin password
    const shameer = await mongoose.connection.db.collection('users').findOne({ username: 'shameer' });
    if (shameer) {
      console.log('Found franchise admin:', shameer.username);
      
      // Create simple password hash
      const simplePassword = 'simple123';
      const hashedPassword = await bcrypt.hash(simplePassword, 10);
      
      // Update user with new password
      await mongoose.connection.db.collection('users').updateOne(
        { _id: shameer._id },
        { $set: { 
            password: hashedPassword,
            status: 'active'
          }
        }
      );
      
      console.log(`Updated franchise admin password to: ${simplePassword}`);
    } else {
      console.log('Franchise admin user not found');
    }
    
    // Reset voter password
    const voter = await mongoose.connection.db.collection('users').findOne({ username: 'VOTE1001' });
    if (voter) {
      console.log('Found voter:', voter.username);
      
      // Create simple password hash
      const simplePassword = 'simple123';
      const hashedPassword = await bcrypt.hash(simplePassword, 10);
      
      // Update user with new password
      await mongoose.connection.db.collection('users').updateOne(
        { _id: voter._id },
        { $set: { 
            password: hashedPassword,
            status: 'active'
          }
        }
      );
      
      console.log(`Updated voter password to: ${simplePassword}`);
    } else {
      console.log('Voter not found');
    }
    
    // Verify updates
    console.log('\nVerifying users after password reset:');
    
    // Verify franchise admin
    const updatedShameer = await mongoose.connection.db.collection('users').findOne({ username: 'shameer' });
    if (updatedShameer) {
      console.log(`Franchise admin status: ${updatedShameer.status}`);
      console.log(`Password length: ${updatedShameer.password?.length || 0}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('simple123', updatedShameer.password);
      console.log(`Password verification: ${isPasswordValid ? 'Success' : 'Failed'}`);
    }
    
    // Verify voter
    const updatedVoter = await mongoose.connection.db.collection('users').findOne({ username: 'VOTE1001' });
    if (updatedVoter) {
      console.log(`\nVoter status: ${updatedVoter.status}`);
      console.log(`Password length: ${updatedVoter.password?.length || 0}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare('simple123', updatedVoter.password);
      console.log(`Password verification: ${isPasswordValid ? 'Success' : 'Failed'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetPasswords();
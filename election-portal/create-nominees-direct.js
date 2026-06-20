import { MongoClient, ObjectId } from 'mongodb';

// Connection URL and database name
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'electionManagement';

// Sample nominees data
const electionId = '6831438a339fd34223327444';
const testNominees = [
  {
    name: 'John Smith',
    gender: 'male',
    position: 1,
    bio: 'Experienced leader with a focus on community development.',
    electionId: new ObjectId(electionId),
    status: 'active'
  },
  {
    name: 'Sarah Johnson',
    gender: 'female',
    position: 2,
    bio: 'Advocate for education reform and youth programs.',
    electionId: new ObjectId(electionId),
    status: 'active'
  },
  {
    name: 'Michael Wong',
    gender: 'male',
    position: 3,
    bio: 'Financial expert committed to transparent budgeting.',
    electionId: new ObjectId(electionId),
    status: 'active'
  },
  {
    name: 'Priya Patel',
    gender: 'female',
    position: 4,
    bio: 'Community organizer with extensive volunteer experience.',
    electionId: new ObjectId(electionId),
    status: 'active'
  },
  {
    name: 'David Chen',
    gender: 'male',
    position: 5,
    bio: 'Technology specialist focused on digital innovation.',
    electionId: new ObjectId(electionId),
    status: 'active'
  }
];

async function addNominees() {
  const client = new MongoClient(url);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const collection = db.collection('nominees');
    
    // Check if we already have nominees for this election
    const existingCount = await collection.countDocuments({ 
      electionId: new ObjectId(electionId) 
    });
    
    if (existingCount > 0) {
      console.log(`This election already has ${existingCount} nominees. Here they are:`);
      const existingNominees = await collection.find({ 
        electionId: new ObjectId(electionId) 
      }).toArray();
      
      existingNominees.forEach(nominee => {
        console.log(`- ${nominee.name} (${nominee.gender})`);
      });
    } else {
      // Insert nominees
      const result = await collection.insertMany(testNominees);
      console.log(`${result.insertedCount} nominees were inserted`);
      
      // Verify the inserted nominees
      const insertedNominees = await collection.find({ 
        electionId: new ObjectId(electionId) 
      }).toArray();
      
      console.log('Inserted nominees:');
      insertedNominees.forEach(nominee => {
        console.log(`- ${nominee.name} (${nominee.gender})`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

// Run the function
addNominees();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server');
const User = require('./models/User');
require('dotenv').config();

// Suppress deprecation warnings
mongoose.set('strictQuery', true);

// Test user credentials
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  subjectsToLearn: [
    { subject: 'Mathematics', proficiency: 3 },
    { subject: 'Physics', proficiency: 2 }
  ],
  subjectsToTeach: [
    { subject: 'Computer Science', proficiency: 4 },
    { subject: 'English', proficiency: 5 }
  ]
};

const TEST_MATCH = {
  name: 'Potential Match',
  email: 'match@example.com',
  password: 'password123',
  subjectsToLearn: [
    { subject: 'Computer Science', proficiency: 2 },
    { subject: 'English', proficiency: 3 }
  ],
  subjectsToTeach: [
    { subject: 'Mathematics', proficiency: 4 },
    { subject: 'Physics', proficiency: 5 }
  ]
};

let authToken;
let testUserId;
let matchUserId;

async function connectDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('Connection string used:', process.env.MONGO_URI ? 'Present' : 'Missing');
    console.error('Please check your .env file and ensure MongoDB is running');
    return false;
  }
}

async function setupTestData() {
  try {
    // Clear existing test data
    await User.deleteMany({ 
      email: { $in: [TEST_USER.email, TEST_MATCH.email] } 
    });

    // Create test users
    const testUser = await User.create(TEST_USER);
    testUserId = testUser._id;
    
    const matchUser = await User.create(TEST_MATCH);
    matchUserId = matchUser._id;
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    authToken = jwt.sign(
      { userId: testUserId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('✅ Test data created');
    return true;
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    return false;
  }
}

async function testMatching() {
  console.log('🚀 Starting matching system tests...\n');
  
  // Connect to MongoDB
  if (!await connectDB()) {
    console.log('❌ Exiting due to connection error');
    process.exit(1);
  }

  try {
    // Setup test data
    if (!await setupTestData()) {
      throw new Error('Failed to set up test data');
    }

    // Test 1: Get potential matches
    console.log('\n🔍 Testing GET /api/matches');
    const matchesRes = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log('Status:', matchesRes.status);
    if (matchesRes.status === 200) {
      console.log('✅ Successfully retrieved matches');
      console.log(`📊 Found ${matchesRes.body.length} potential matches`);
      if (matchesRes.body.length > 0) {
        console.log('🎯 First match details:', {
          name: matchesRes.body[0].name,
          score: matchesRes.body[0].matchScore,
          commonSubjects: matchesRes.body[0].commonSubjects
        });
      }
    } else {
      console.error('❌ Failed to get matches:', matchesRes.body);
    }

    // Test 2: Like a user
    console.log('\n❤️  Testing POST /api/matches/like/:userId');
    const likeRes = await request(app)
      .post(`/api/matches/like/${matchUserId}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log('Status:', likeRes.status);
    if (likeRes.status === 200) {
      console.log('✅ Successfully sent like');
      console.log('🤝 Match result:', likeRes.body.matched ? 'MATCHED! 🎉' : 'Waiting for mutual like');
    } else {
      console.error('❌ Failed to send like:', likeRes.body);
    }

    // Test 3: Get connections
    console.log('\n🤝 Testing GET /api/matches/connections');
    const connectionsRes = await request(app)
      .get('/api/matches/connections')
      .set('Authorization', `Bearer ${authToken}`);
    
    console.log('Status:', connectionsRes.status);
    if (connectionsRes.status === 200) {
      console.log('✅ Successfully retrieved connections');
      console.log(`👥 Number of connections: ${connectionsRes.body.length}`);
    } else {
      console.error('❌ Failed to get connections:', connectionsRes.body);
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    // Cleanup
    try {
      if (testUserId || matchUserId) {
        await User.deleteMany({ _id: { $in: [testUserId, matchUserId].filter(Boolean) } });
        console.log('🧹 Cleaned up test data');
      }
      await mongoose.disconnect();
      console.log('\n✅ Test completed');
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

// Run the tests
testMatching();

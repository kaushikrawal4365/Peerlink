const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

let mongoServer;
let authToken;
let user1Id, user2Id, user3Id;

// Setup and Teardown
beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  // Create test users
  const user1 = await User.create({
    name: 'Test User 1',
    email: 'test1@example.com',
    password: 'password123',
    subjectsToLearn: [
      { subject: 'Mathematics', proficiency: 3 },
      { subject: 'Physics', proficiency: 2 }
    ],
    subjectsToTeach: [
      { subject: 'Computer Science', proficiency: 4 },
      { subject: 'English', proficiency: 5 }
    ]
  });
  user1Id = user1._id;

  const user2 = await User.create({
    name: 'Test User 2',
    email: 'test2@example.com',
    password: 'password123',
    subjectsToLearn: [
      { subject: 'Computer Science', proficiency: 2 },
      { subject: 'English', proficiency: 3 }
    ],
    subjectsToTeach: [
      { subject: 'Mathematics', proficiency: 4 },
      { subject: 'Physics', proficiency: 5 }
    ]
  });
  user2Id = user2._id;

  const user3 = await User.create({
    name: 'Test User 3',
    email: 'test3@example.com',
    password: 'password123',
    subjectsToLearn: [
      { subject: 'Computer Science', proficiency: 1 },
      { subject: 'English', proficiency: 2 }
    ],
    subjectsToTeach: [
      { subject: 'Mathematics', proficiency: 3 },
      { subject: 'Chemistry', proficiency: 4 }
    ]
  });
  user3Id = user3._id;

  // Login to get auth token (simplified for testing)
  authToken = 'test-token';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Matching System', () => {
  test('should get potential matches', async () => {
    const response = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Verify match scores are in descending order
    const scores = response.body.map(match => match.matchScore);
    const sortedScores = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sortedScores);
  });

  test('should like a user and create a match', async () => {
    const response = await request(app)
      .post(`/api/matches/like/${user2Id}`)
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('matched');
    expect(response.body.message).toBeDefined();
  });

  test('should get connections after matching', async () => {
    const response = await request(app)
      .get('/api/matches/connections')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

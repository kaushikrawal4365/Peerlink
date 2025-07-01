const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

let token;
let testUser;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/peerlink_test');
  
  // Create a test user
  testUser = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  token = jwt.sign({ userId: testUser._id }, process.env.JWT_SECRET || 'test-secret');
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Subject Management', () => {
  test('Add teaching subject', async () => {
    const res = await request(app)
      .post('/api/profile/subjectsToTeach')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Mathematics',
        proficiency: 5
      });
    
    expect(res.status).toBe(200);
    expect(res.body.subjectsToTeach).toHaveLength(1);
    expect(res.body.subjectsToTeach[0]).toEqual({
      subject: 'Mathematics',
      proficiency: 5
    });
  });

  test('Add learning subject', async () => {
    const res = await request(app)
      .post('/api/profile/subjectsToLearn')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Physics',
        proficiency: 2
      });
    
    expect(res.status).toBe(200);
    expect(res.body.subjectsToLearn).toHaveLength(1);
    expect(res.body.subjectsToLearn[0]).toEqual({
      subject: 'Physics',
      proficiency: 2
    });
  });

  test('Remove teaching subject', async () => {
    const res = await request(app)
      .delete('/api/profile/subjectsToTeach/Mathematics')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.subjectsToTeach).toHaveLength(0);
  });

  test('Remove learning subject', async () => {
    const res = await request(app)
      .delete('/api/profile/subjectsToLearn/Physics')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.subjectsToLearn).toHaveLength(0);
  });

  test('Add duplicate subject fails', async () => {
    // First add
    await request(app)
      .post('/api/profile/subjectsToTeach')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Mathematics',
        proficiency: 5
      });
    
    // Try to add again
    const res = await request(app)
      .post('/api/profile/subjectsToTeach')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Mathematics',
        proficiency: 5
      });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Subject already exists');
  });

  test('Invalid proficiency level fails', async () => {
    const res = await request(app)
      .post('/api/profile/subjectsToLearn')
      .set('Authorization', `Bearer ${token}`)
      .send({
        subject: 'Chemistry',
        proficiency: 6 // Invalid: should be 1-5
      });
    
    expect(res.status).toBe(400);
  });
});

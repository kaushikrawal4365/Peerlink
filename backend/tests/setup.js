// Set up test environment variables
process.env.MONGO_URI_TEST = 'mongodb://localhost:27017/peerlink_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = 5001; // Use different port for tests

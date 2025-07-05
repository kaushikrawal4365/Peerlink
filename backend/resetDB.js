const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    return mongoose.connection.db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Drop all collections
const dropAllCollections = async () => {
  const db = await connectDB();
  const collections = await db.listCollections().toArray();
  
  for (const collection of collections) {
    await db.dropCollection(collection.name);
    console.log(`Dropped collection: ${collection.name}`);
  }
  
  console.log('✅ All collections dropped');
  process.exit(0);
};

dropAllCollections().catch(console.error);

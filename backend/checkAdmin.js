const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ isAdmin: true });
    
    if (adminUsers.length === 0) {
      console.log('No admin users found');
    } else {
      console.log('Admin users:');
      adminUsers.forEach(user => {
        console.log('-------------------');
        console.log(`Name: ${user.name}`);
        console.log(`Email: ${user.email}`);
        console.log(`Status: ${user.status}`);
        console.log(`Created At: ${user.createdAt}`);
      });
    }

  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkAdmin();

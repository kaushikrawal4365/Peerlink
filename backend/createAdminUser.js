const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@peerlink.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123456', 10);
    const admin = new User({
      name: 'Admin',
      email: 'admin@peerlink.com',
      password: hashedPassword,
      isAdmin: true,
      isProfileComplete: true,
      status: 'online',
      lastActive: new Date(),
      subjectsToTeach: [
        { subject: 'Mathematics', proficiency: 5 },
        { subject: 'Computer Science', proficiency: 5 }
      ],
      subjectsToLearn: [
        { subject: 'Physics', proficiency: 3 },
        { subject: 'Chemistry', proficiency: 2 }
      ]
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@peerlink.com');
    console.log('Password: admin123456');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdminUser();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const verifyAdminLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const adminEmail = 'admin@peerlink.com';
    const admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log('Admin user not found. Creating one...');
      const hashedPassword = await bcrypt.hash('admin123456', 10);
      const newAdmin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true,
        isProfileComplete: true,
        status: 'online',
        subjectsToTeach: [{ subject: 'Admin', proficiency: 5 }],
        subjectsToLearn: []
      });
      await newAdmin.save();
      console.log('Admin user created successfully!');
      console.log('Email: admin@peerlink.com');
      console.log('Password: admin123456');
    } else {
      console.log('Admin user exists. Verifying login...');
      const isPasswordValid = await bcrypt.compare('admin123456', admin.password);
      if (isPasswordValid) {
        console.log('✅ Login successful with admin@peerlink.com / admin123456');
      } else {
        console.log('❌ Invalid password for admin@peerlink.com');
        console.log('Resetting admin password...');
        admin.password = await bcrypt.hash('admin123456', 10);
        await admin.save();
        console.log('✅ Admin password reset to: admin123456');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

verifyAdminLogin();

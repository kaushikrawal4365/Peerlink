const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/peerlink', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
        });
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        let adminUser = await User.findOne({ email: 'admin@peerlink.com' });
        
        if (adminUser) {
            console.log('⚠️ Admin user already exists, updating password...');
            const hashedPassword = await bcrypt.hash('admin123456', 10);
            adminUser.password = hashedPassword;
            adminUser.isAdmin = true;
            adminUser.status = 'online';
            await adminUser.save();
            console.log('✅ Admin password updated successfully');
        } else {
            // Create new admin user with full profile
            const hashedPassword = await bcrypt.hash('admin123456', 10);
            adminUser = new User({
                name: 'Admin User',
                email: 'admin@peerlink.com',
                password: hashedPassword,
                isAdmin: true,
                status: 'online',
                profileCompleted: true,
                subjectsToTeach: [],
                subjectsToLearn: [],
                bio: 'System Administrator'
            });
            await adminUser.save();
            console.log('✅ Admin user created successfully');
        }

        console.log('\nAdmin Credentials:');
        console.log('Email: admin@peerlink.com');
        console.log('Password: admin123456');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Database connection closed');
    }
};

createAdmin();

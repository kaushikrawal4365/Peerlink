// --- Core Node Modules ---
const http = require('http');

// --- NPM Packages ---
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const socketIo = require('socket.io');

// --- Load Environment Variables ---
dotenv.config();

// --- Model Imports ---
const User = require('./models/User');
const Message = require('./models/Message');

// --- Route Imports ---
const adminRoutes = require('./routes/adminRoutes');
const matchRoutes = require('./routes/matchRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const internalRoutes = require('./routes/internalRoutes');

// --- Middleware Imports ---
const authMiddleware = require('./middleware/authMiddleware');

// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// --- Global Middleware ---
app.set('io', io); // Make io accessible to all routes
app.use(cors());
app.use(express.json());

// --- API Route Definitions ---

// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      isProfileComplete: false // Ensure new users complete profile setup
    });
    await user.save();
    const token = jwt.sign({ 
      userId: user._id, 
      isAdmin: user.isAdmin 
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ 
      token, 
      isProfileComplete: user.isProfileComplete,
      name: user.name,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Account is blocked.' });
    }
    user.status = 'online';
    user.lastActive = new Date();
    await user.save();
    const token = jwt.sign({ 
      userId: user._id, 
      isAdmin: user.isAdmin 
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      token, 
      isAdmin: user.isAdmin, 
      name: user.name,
      isProfileComplete: user.isProfileComplete || false
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

// Admin User Management Routes
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get all users (excluding passwords)
    const users = await User.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user status (block/unblock)
app.put('/api/users/:id/status', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status } = req.body;
    const userId = req.params.id;

    // Prevent modifying other admins
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot modify your own status' });    
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent modifying other admins
    if (user.isAdmin) {
      return res.status(400).json({ error: 'Cannot modify admin users' });
    }

    user.status = status;
    await user.save();

    res.json({ message: 'User status updated', user: { _id: user._id, status: user.status } });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = req.params.id;

    // Prevent deleting self
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting other admins
    if (user.isAdmin) {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User Profile & Subject Management Routes
app.get('/api/users/profile', authMiddleware, async (req, res) => {
  console.log('[API] GET /api/users/profile route reached for user:', req.user.email);
  try {
    // The user document is already attached by authMiddleware
    res.json(req.user);
  } catch (err) {
    console.error('[API] Error fetching profile:', err.message);
    res.status(500).send('Server Error');
  }
});

app.put('/api/users/profile', authMiddleware, async (req, res) => {
    console.log(`[API] PUT /api/users/profile route reached for user: ${req.user.email}`);
    const { bio, subjectsToTeach, subjectsToLearn } = req.body;
    try {
        const updateData = {
            bio, 
            subjectsToTeach, 
            subjectsToLearn, 
            isProfileComplete: true
        };

        // Explicitly set the options to return the updated document
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { 
                new: true,
                returnDocument: 'after',
                runValidators: true
            }
        ).lean();

        if (!updatedUser) {
            console.error(`[API] Failed to find and update user: ${req.user._id}`);
            return res.status(404).json({ error: 'User not found during update.' });
        }

        console.log(`[API] Profile updated successfully for user: ${updatedUser.email}`);
        
        // Ensure we're sending back the isProfileComplete flag
        const response = {
            ...updatedUser,
            isProfileComplete: true
        };
        
        res.json(response);
    } catch (err) {
        console.error('[API] Error updating profile:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Admin User Management Routes
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id/status', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot modify admin status' });
    }
    
    user.status = req.body.status;
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.isAdmin) {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Core Application Routes
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/matches', authMiddleware, matchRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/subjects', authMiddleware, subjectRoutes);
app.use('/api/internal', internalRoutes); // No auth for internal services

// --- Socket.io Connection Handling ---
const connectedUsers = new Map();
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        socket.userId = user._id.toString();
        connectedUsers.set(socket.userId, socket.id);
        await User.findByIdAndUpdate(socket.userId, { status: 'online', lastActive: new Date(), socketId: socket.id });
        io.emit('user_status_changed', { userId: socket.userId, status: 'online' });
        const unreadCount = await Message.countDocuments({ recipient: socket.userId, read: false });
        socket.emit('unread_count', unreadCount);
      }
    } catch (error) {
      console.error('Socket authentication error:', error.message);
    }
  });

  socket.on('disconnect', async () => {
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { status: 'offline', lastActive: new Date() });
      io.emit('user_status_changed', { userId: socket.userId, status: 'offline' });
      connectedUsers.delete(socket.userId);
    }
    console.log('User disconnected:', socket.id);
  });
});

// --- Database Connection & Server Startup ---
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

// Graceful Shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed through app termination.');
  server.close(() => {
    process.exit(0);
  });
});

// --- Initiate Server Start ---
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// --- Export for Testing ---
module.exports = { app, server, mongoose };
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const adminRoutes = require('./routes/adminRoutes');
const matchRoutes = require('./routes/matchRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const authMiddleware = require('./middleware/authMiddleware');

// Load env vars BEFORE anything else
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection configuration
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 'majority'
};

// Connect to MongoDB with retry logic
const connectDB = async () => {
  const maxRetries = 5;
  let retries = 0;
  
  const connectWithRetry = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, mongoOptions);
      console.log('✅ Connected to MongoDB:', conn.connection.host);
      return conn;
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB connection error (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries < maxRetries) {
        console.log(`Retrying connection in 5 seconds...`);
        setTimeout(connectWithRetry, 5000);
      } else {
        console.error('❌ Max retries reached. Exiting...');
        process.exit(1);
      }
    }
  };
  
  return connectWithRetry();
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from DB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Socket.io connection handling
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user) {
        socket.userId = user._id;
        user.socketId = socket.id;
        user.status = 'online';
        user.lastActive = new Date();
        await user.save();
        
        // Store the connection
        connectedUsers.set(user._id.toString(), socket.id);
        
        // Notify others about user's online status
        io.emit('user_status_changed', { userId: user._id, status: 'online' });
        
        // Send unread messages count
        const unreadCount = await Message.countDocuments({
          recipient: user._id,
          read: false
        });
        socket.emit('unread_count', unreadCount);
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
    }
  });

  socket.on('disconnect', async () => {
    const userId = [...connectedUsers.entries()]
      .find(([_, socketId]) => socketId === socket.id)?.[0];
    
    if (userId) {
      connectedUsers.delete(userId);
      try {
        await User.findByIdAndUpdate(userId, {
          status: 'offline',
          lastActive: new Date()
        });
        
        // Notify admin clients about user status change
        io.emit('user_status_changed', { userId, status: 'offline' });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  });
});

const User = require('./models/User');

// Signup Route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Account is blocked. Please contact administrator.' });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        isAdmin: user.isAdmin,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update user status to online
    user.status = 'online';
    user.lastActive = new Date();
    await user.save();

    res.json({ 
      token,
      isAdmin: user.isAdmin,
      name: user.name
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Using imported authMiddleware from './middleware/authMiddleware'

// Apply auth middleware to protected routes
app.use('/api/matches', authMiddleware, matchRoutes);
app.use('/api/chat', authMiddleware, chatRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Protected Profile Route
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('❌ Profile fetch error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Profile Setup Route
app.post('/api/profile/setup', authMiddleware, async (req, res) => {
  try {
    const { bio, subjectsToTeach, subjectsToLearn } = req.body;
    
    const user = await User.findById(req.user._id);
    user.bio = bio;
    user.subjectsToTeach = subjectsToTeach;
    user.subjectsToLearn = subjectsToLearn;
    user.isProfileComplete = true;
    
    await user.save();
    res.json({ message: 'Profile setup completed successfully' });
  } catch (error) {
    console.error('❌ Profile setup error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Add teaching subject
app.post('/api/profile/subjectsToTeach', authMiddleware, async (req, res) => {
  try {
    const { subject, proficiency } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user.subjectsToTeach.some(s => s.subject === subject)) {
      return res.status(400).json({ error: 'Subject already exists' });
    }
    
    user.subjectsToTeach.push({ subject, proficiency });
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error adding teaching subject:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add learning subject
app.post('/api/profile/subjectsToLearn', authMiddleware, async (req, res) => {
  try {
    const { subject, proficiency } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user.subjectsToLearn.some(s => s.subject === subject)) {
      return res.status(400).json({ error: 'Subject already exists' });
    }
    
    user.subjectsToLearn.push({ subject, proficiency });
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error adding learning subject:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove teaching subject
app.delete('/api/profile/subjectsToTeach/:subject', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.subjectsToTeach = user.subjectsToTeach.filter(
      s => s.subject !== req.params.subject
    );
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error removing teaching subject:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove learning subject
app.delete('/api/profile/subjectsToLearn/:subject', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.subjectsToLearn = user.subjectsToLearn.filter(
      s => s.subject !== req.params.subject
    );
    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error removing learning subject:', error);
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/admin', adminRoutes);
app.use('/subjects', subjectRoutes);

// Export for testing
module.exports = { app, server, connectDB };

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  });
}
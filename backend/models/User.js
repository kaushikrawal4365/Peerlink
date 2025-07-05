const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    unique: true, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  bio: { 
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  subjectsToLearn: [{
    subject: { type: String, required: true },
    desiredLevel: { type: Number, required: true },
    priority: { type: Number, required: true }
  }],
  subjectsToTeach: [{
    subject: { type: String, required: true },
    proficiency: { type: Number, required: true },
    teachingExperience: { type: Number, default: 0 }
  }],
  matches: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    matchScore: {
      type: Number,
      required: true
    },
    commonSubjects: {
      teach: [String],
      learn: [String]
    },
    matchDate: {
      type: Date,
      default: Date.now
    }
  }],
  calendar: [{
    sessionDate: { type: Date, required: true },
    withUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    meetLink: { type: String },
    notes: { type: String }
  }],
  testimonials: [{
    text: { type: String, required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { 
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  teachingScore: { 
    type: Number, 
    default: 0 
  },
  learningScore: { 
    type: Number, 
    default: 0 
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'blocked'],
    default: 'offline'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'blocked'],
    default: 'offline'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('User', userSchema);
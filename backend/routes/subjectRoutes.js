const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   POST /subjects/teach
// @desc    Add a subject to teach
// @access  Private
router.post('/teach', authMiddleware, async (req, res) => {
  const { subject, proficiency } = req.body;
  if (!subject || !proficiency) {
    return res.status(400).json({ error: 'Subject and proficiency are required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    
    const subjectExists = user.subjectsToTeach.some(s => s.subject === subject);
    if (subjectExists) {
      return res.status(400).json({ error: 'You are already teaching this subject.' });
    }

    user.subjectsToTeach.push({ subject, proficiency });
    await user.save();
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// @route   POST /subjects/learn
// @desc    Add a subject to learn
// @access  Private
router.post('/learn', authMiddleware, async (req, res) => {
  const { subject } = req.body;
  if (!subject) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  try {
    const user = await User.findById(req.user._id);

    const subjectExists = user.subjectsToLearn.some(s => s.subject === subject);
    if (subjectExists) {
      return res.status(400).json({ error: 'You are already learning this subject.' });
    }

    user.subjectsToLearn.push({ subject });
    await user.save();
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /subjects/teach
// @desc    Delete a subject from teaching list
// @access  Private
router.delete('/teach', authMiddleware, async (req, res) => {
  const { subject } = req.body;
  if (!subject) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    user.subjectsToTeach = user.subjectsToTeach.filter(s => s.subject !== subject);
    await user.save();
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /subjects/learn
// @desc    Delete a subject from learning list
// @access  Private
router.delete('/learn', authMiddleware, async (req, res) => {
  const { subject } = req.body;
  if (!subject) {
    return res.status(400).json({ error: 'Subject is required.' });
  }

  try {
    const user = await User.findById(req.user._id);
    user.subjectsToLearn = user.subjectsToLearn.filter(s => s.subject !== subject);
    await user.save();
    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

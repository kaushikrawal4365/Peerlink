const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { 
  getPotentialMatches, 
  respondToMatch, 
  getMyMatches 
} = require('../controllers/matchController');

// @route   GET /api/matches
// @desc    Get potential matches for the current user
// @access  Private
router.get('/', auth, getPotentialMatches);

// @route   PUT /api/matches/:userId
// @desc    Respond to a match (accept/reject)
// @access  Private
router.put('/:userId', auth, respondToMatch);

// @route   GET /api/matches/accepted
// @desc    Get all accepted matches for the current user
// @access  Private
router.get('/accepted', auth, getMyMatches);

// ✅ Like/connect with another user
router.post('/like/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already matched
    let existingMatch = currentUser.matches.find(
      m => m.user.toString() === targetUserId
    );

    // Get match score using ML
    const allUsers = await User.find({ _id: { $ne: currentUserId } });
    const mlMatches = await calculateBestMatches(currentUser, allUsers);
    const matchedUser = mlMatches.find(m => m.user.toString() === targetUserId);
    const score = matchedUser ? matchedUser.matchScore : 0;

    if (existingMatch) {
      existingMatch.status = 'pending';
      existingMatch.matchScore = score;
    } else {
      currentUser.matches.push({
        user: targetUserId,
        status: 'pending',
        matchScore: score
      });
    }

    await currentUser.save();

    // Check if mutual match
    let reverseMatch = targetUser.matches.find(
      m => m.user.toString() === currentUserId.toString() && m.status === 'pending'
    );

    if (reverseMatch) {
      reverseMatch.status = 'accepted';
      await targetUser.save();

      let currentMatch = currentUser.matches.find(
        m => m.user.toString() === targetUserId
      );
      currentMatch.status = 'accepted';
      await currentUser.save();

      // 🔔 Emit socket notification
      if (targetUser.socketId) {
        req.app.get('io').to(targetUser.socketId).emit('match', {
          userId: currentUserId,
          userName: currentUser.name
        });
      }

      return res.json({ matched: true, message: "It's a match!" });
    }

    res.json({ matched: false, message: 'Match request sent' });
  } catch (error) {
    console.error('❌ Error liking user:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ Reject a user
router.post('/reject/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.userId;

    const currentUser = await User.findById(currentUserId);
    const match = currentUser.matches.find(
      m => m.user.toString() === targetUserId
    );

    if (match) {
      match.status = 'rejected';
    } else {
      currentUser.matches.push({
        user: targetUserId,
        status: 'rejected',
        matchScore: 0
      });
    }

    await currentUser.save();
    res.json({ message: 'User rejected successfully' });
  } catch (error) {
    console.error('❌ Error rejecting user:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ Get accepted connections
router.get('/connections', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('matches.user', '-password');

    const accepted = user.matches.filter(m => m.status === 'accepted');
    res.json(accepted);
  } catch (error) {
    console.error('❌ Error fetching connections:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// ✅ Optional: Get pending matches (can be removed if using ML route `/`)
router.get('/potential', auth, async (req, res) => {
  try {
    const userWithMatches = await User.findById(req.user._id).populate({
      path: 'matches.user',
      select: '-password'
    });

    if (!userWithMatches) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const potential = userWithMatches.matches
      .filter(match => match.status === 'pending')
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(potential.map(m => m.user));
  } catch (error) {
    console.error('❌ Error getting pending matches:', error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;

const { findMatches, updateMatchStatus, getAcceptedMatches } = require('../utils/matchUtils');

/**
 * @route   GET /api/matches
 * @desc    Get potential matches for the current user
 * @access  Private
 */
const getPotentialMatches = async (req, res) => {
  try {
    console.log('Received request for potential matches for user:', req.user._id);
    const matches = await findMatches(req.user._id);
    console.log('Found', matches.length, 'potential matches');
    res.json(matches);
  } catch (error) {
    console.error('Error getting potential matches:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: 'Server error while finding matches',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @route   PUT /api/matches/:userId
 * @desc    Update match status (accept/reject)
 * @access  Private
 */
const respondToMatch = async (req, res) => {
  try {
    const { status } = req.body;
    const { userId: targetUserId } = req.params;
    
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be "accepted" or "rejected"' });
    }

    const result = await updateMatchStatus(req.user._id, targetUserId, status);
    res.json(result);
  } catch (error) {
    console.error('Error responding to match:', error);
    res.status(500).json({ error: error.message || 'Server error while updating match status' });
  }
};

/**
 * @route   GET /api/matches/accepted
 * @desc    Get all accepted matches for the current user
 * @access  Private
 */
const getMyMatches = async (req, res) => {
  try {
    const matches = await getAcceptedMatches(req.user._id);
    res.json(matches);
  } catch (error) {
    console.error('Error getting accepted matches:', error);
    res.status(500).json({ error: error.message || 'Server error while getting matches' });
  }
};

module.exports = {
  getPotentialMatches,
  respondToMatch,
  getMyMatches
};

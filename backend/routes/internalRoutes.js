const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/internal/users-for-ml
// @desc    Fetch all users with the data needed for the ML service
// @access  Private (should only be called by the ML service)
router.get('/users-for-ml', async (req, res) => {
  try {
    // Fetch only the necessary fields to keep the payload small
    const users = await User.find({}).select('_id name subjectsToTeach subjectsToLearn');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users for ML service:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/internal/update-matches
// @desc    Receive match data and bulk update users
// @access  Private
router.post('/update-matches', async (req, res) => {
  const { matches } = req.body;

  if (!matches) {
    return res.status(400).json({ msg: 'Match data is required.' });
  }

  try {
    const bulkOps = Object.keys(matches).map(userId => {
      const newMatchesForUser = matches[userId].map(match => ({
        user: match.matchedUserId,
        matchScore: match.score,
        status: 'pending' // Reset status for new matches
      }));

      return {
        updateOne: {
          filter: { _id: userId },
          // Use $set to completely replace the old matches array
          update: { $set: { matches: newMatchesForUser } }
        }
      };
    });

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
      console.log(`Matches updated for ${bulkOps.length} users.`);
      res.json({ msg: 'Matches updated successfully.' });
    } else {
      res.json({ msg: 'No matches to update.' });
    }
  } catch (err) {
    console.error('Error updating matches:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

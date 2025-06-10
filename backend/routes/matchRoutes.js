const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { findMatches } = require('../services/matchingService');

// Get potential matches
router.get('/potential', async (req, res) => {
    try {
        const userId = req.user._id;
        const matches = await findMatches(userId);
        
        // Get full user details for matches
        const potentialMatches = await User.find(
            { 
                _id: { $in: matches.map(m => m.user) },
                status: { $ne: 'blocked' }
            },
            '-password'
        );

        // Combine user details with match scores
        const detailedMatches = potentialMatches.map(user => {
            const matchData = matches.find(m => m.user.toString() === user._id.toString());
            return {
                ...user.toObject(),
                matchScore: matchData.matchScore
            };
        });

        res.json(detailedMatches);
    } catch (error) {
        console.error('Error getting potential matches:', error);
        res.status(500).json({ error: error.message });
    }
});

// Like/Connect with a user
router.post('/like/:userId', async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        // Check if the match already exists
        const user = await User.findById(currentUserId);
        const existingMatch = user.matches.find(
            m => m.user.toString() === targetUserId
        );

        if (existingMatch) {
            existingMatch.status = 'pending';
            await user.save();
        } else {
            // Add new match
            user.matches.push({
                user: targetUserId,
                status: 'pending',
                matchScore: await findMatches(currentUserId, [targetUserId])
            });
            await user.save();
        }

        // Check if the other user has already liked current user
        const targetUser = await User.findById(targetUserId);
        const mutualMatch = targetUser.matches.find(
            m => m.user.toString() === currentUserId.toString() && m.status === 'pending'
        );

        if (mutualMatch) {
            // It's a match! Update both users' match status
            mutualMatch.status = 'accepted';
            await targetUser.save();

            const currentUserMatch = user.matches.find(
                m => m.user.toString() === targetUserId
            );
            currentUserMatch.status = 'accepted';
            await user.save();

            // Emit socket event for match notification
            req.app.get('io').to(targetUser.socketId).emit('match', {
                userId: currentUserId,
                userName: user.name
            });
        }

        res.json({ message: 'Match request sent successfully' });
    } catch (error) {
        console.error('Error liking user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's matches
router.get('/connections', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('matches.user', '-password');
        
        const connections = user.matches.filter(m => m.status === 'accepted');
        res.json(connections);
    } catch (error) {
        console.error('Error getting connections:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

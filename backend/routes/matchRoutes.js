const express = require('express');
const router = express.Router();
const User = require('../models/User');
// Get potential matches, sorted by score
router.get('/potential', async (req, res) => {
    try {
        const userWithMatches = await User.findById(req.user._id).populate({
            path: 'matches.user',
            select: '-password' // Exclude passwords of matched users
        });

        if (!userWithMatches) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Filter for pending matches and sort by score
        const potentialMatches = userWithMatches.matches
            .filter(match => match.status === 'pending')
            .sort((a, b) => b.matchScore - a.matchScore);

        // The `user` field within each match object is now populated
        res.json(potentialMatches.map(m => m.user));

    } catch (error) {
        console.error('Error getting potential matches:', error);
        res.status(500).json({ error: 'Server Error' });
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

// Reject a user
router.post('/reject/:userId', async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const targetUserId = req.params.userId;

        const user = await User.findById(currentUserId);
        const match = user.matches.find(
            m => m.user.toString() === targetUserId
        );

        if (match) {
            match.status = 'rejected';
            await user.save();
            res.json({ message: 'User rejected successfully' });
        } else {
            // If no pre-existing match, create one with 'rejected' status
            user.matches.push({
                user: targetUserId,
                status: 'rejected',
                matchScore: 0 // Score is unknown, but we need to record the rejection
            });
            await user.save();
            res.json({ message: 'User rejected successfully' });
        }
    } catch (error) {
        console.error('Error rejecting user:', error);
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

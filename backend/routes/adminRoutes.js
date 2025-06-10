const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Message = require('../models/Message');

// Get all users with their current status
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        // Update inactive users' status
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        users.forEach(user => {
            if (user.lastActive < fifteenMinutesAgo) {
                user.status = 'offline';
            }
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user statistics
router.get('/stats', adminMiddleware, async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            activeUsers: await User.countDocuments({ status: 'online' }),
            totalMessages: await Message.countDocuments(),
            newUsersToday: await User.countDocuments({
                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
            }),
            subjectStats: await User.aggregate([
                { $project: { 
                    subjectsToTeach: 1, 
                    subjectsToLearn: 1 
                }},
                { $unwind: '$subjectsToTeach' },
                { $group: {
                    _id: '$subjectsToTeach',
                    teachCount: { $sum: 1 }
                }}
            ])
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user status (block/unblock)
router.put('/users/:userId/status', adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        
        const user = await User.findByIdAndUpdate(
            userId,
            { status },
            { new: true }
        ).select('-password');
        
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user activity logs
router.get('/logs', adminMiddleware, async (req, res) => {
    try {
        const logs = await Message.aggregate([
            {
                $group: {
                    _id: { 
                        $dateToString: { 
                            format: '%Y-%m-%d', 
                            date: '$createdAt' 
                        }
                    },
                    messageCount: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 30 }
        ]);
        
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Get user's notifications
router.get('/', async (req, res) => {
    try {
        const notifications = await Notification.find({ 
            to: req.user._id,
            status: { $ne: 'archived' }
        })
        .sort({ createdAt: -1 })
        .populate('from', 'name profileImage');

        res.json(notifications);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle notification action (accept/decline)
router.post('/:notificationId/:action', async (req, res) => {
    try {
        const { notificationId, action } = req.params;
        const notification = await Notification.findById(notificationId)
            .populate('from', 'name email socketId');

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        if (notification.to.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Update notification status
            notification.status = 'archived';
            await notification.save({ session });

            if (action === 'accept') {
                if (notification.type === 'match_request') {
                    // Update both users' matches
                    await User.findByIdAndUpdate(
                        req.user._id,
                        {
                            $push: {
                                matches: {
                                    user: notification.from._id,
                                    status: 'accepted'
                                }
                            }
                        },
                        { session }
                    );

                    await User.findByIdAndUpdate(
                        notification.from._id,
                        {
                            $push: {
                                matches: {
                                    user: req.user._id,
                                    status: 'accepted'
                                }
                            }
                        },
                        { session }
                    );

                    // Create acceptance notification
                    const acceptanceNotification = new Notification({
                        type: 'match_accepted',
                        from: req.user._id,
                        to: notification.from._id,
                        content: `${req.user.name} accepted your connection request!`
                    });
                    await acceptanceNotification.save({ session });

                    // Notify the other user through socket
                    const io = req.app.get('io');
                    if (notification.from.socketId) {
                        io.to(notification.from.socketId).emit('match_accepted', {
                            matchId: notification._id,
                            user: {
                                _id: req.user._id,
                                name: req.user.name
                            }
                        });
                    }
                }
            }

            await session.commitTransaction();
            res.json({ message: 'Notification handled successfully' });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error('Error handling notification:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

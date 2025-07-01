const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');

// Get conversations list
router.get('/conversations', async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all messages where user is either sender or recipient
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { sender: userId },
                        { recipient: userId }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$sender', userId] },
                            '$recipient',
                            '$sender'
                        ]
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            }
        ]);

        // Get user details for each conversation
        const populatedConversations = await User.populate(conversations, {
            path: '_id',
            select: 'name email status profileImage'
        });

        const formattedConversations = populatedConversations.map(conv => ({
            _id: conv._id._id,
            user: conv._id,
            lastMessage: conv.lastMessage
        }));

        res.json(formattedConversations);
    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get messages for a conversation
router.get('/messages/:userId', async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const otherUserId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, recipient: otherUserId },
                { sender: otherUserId, recipient: currentUserId }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'name')
        .populate('recipient', 'name');

        // Mark messages as read
        await Message.updateMany(
            {
                recipient: currentUserId,
                sender: otherUserId,
                read: false
            },
            {
                read: true,
                readAt: new Date()
            }
        );

        res.json(messages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send a message
router.post('/messages', async (req, res) => {
    try {
        const { recipientId, content } = req.body;
        const senderId = req.user._id;

        const message = new Message({
            sender: senderId,
            recipient: recipientId,
            content
        });

        await message.save();

        // Get recipient's socket ID and emit message
        const recipient = await User.findById(recipientId);
        if (recipient.socketId) {
            req.app.get('io').to(recipient.socketId).emit('new_message', {
                message,
                sender: req.user
            });
        }

        res.json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread message count
router.get('/messages/unread/count', async (req, res) => {
    try {
        const count = await Message.countDocuments({
            recipient: req.user._id,
            read: false
        });
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

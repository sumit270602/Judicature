const Message = require('../models/Message');
const mongoose = require('mongoose');

// Get case-based chat history (existing functionality)
exports.getChatHistory = async (req, res) => {
  try {
    const { caseId } = req.params;
    const messages = await Message.find({ 
      caseId,
      messageType: 'case' // Only get case messages
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role')
      .populate('receiver', 'name role');
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get direct message conversations for the authenticated user
exports.getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Get all unique conversation partners
    const conversations = await Message.aggregate([
      {
        $match: {
          messageType: 'direct',
          $or: [
            { sender: userId },
            { receiver: userId }
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
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participant'
        }
      },
      {
        $unwind: '$participant'
      },
      {
        $project: {
          participant: {
            _id: 1,
            name: 1,
            email: 1,
            role: 1
          },
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get direct messages between two users
exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      messageType: 'direct',
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    // Mark messages as read for the current user
    await Message.updateMany({
      messageType: 'direct',
      sender: otherUserId,
      receiver: currentUserId,
      isRead: false
    }, {
      isRead: true,
      readAt: new Date()
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      page,
      limit,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// Get case messages for a specific case (enhanced version)
exports.getCaseMessages = async (req, res) => {
  try {
    const caseId = req.params.caseId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      messageType: 'case',
      caseId: caseId
    })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      page,
      limit,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get case messages error:', error);
    res.status(500).json({ error: 'Failed to fetch case messages' });
  }
};

// Send a direct message (REST API alternative to socket)
exports.sendDirectMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver ID and message are required' });
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      messageType: 'direct',
      message
    });

    await newMessage.save();
    
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const unreadCount = await Message.countDocuments({
      messageType: 'direct',
      receiver: userId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
}; 
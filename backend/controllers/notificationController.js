
const Notification = require('../models/Notification');

// Get user notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority, unreadOnly } = req.query;
    const userId = req.user.id;
    
    let query = { recipient: userId };
    
    // Apply filters
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .populate('relatedCase', 'title caseNumber')
      .populate('relatedDocument', 'originalName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });
    
    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
};

// Get unread count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.user.id, 
      isRead: false 
    });
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      message: 'Error fetching unread count', 
      error: error.message 
    });
  }
};

// Create notification (admin/system use)
const createNotification = async (req, res) => {
  try {
    const { 
      recipient, 
      type, 
      title, 
      message, 
      priority = 'medium', 
      relatedCase, 
      relatedDocument,
      actionUrl,
      actionRequired = false,
      expiresAt,
      metadata = {}
    } = req.body;
    
    // Validate required fields
    if (!recipient || !type || !title || !message) {
      return res.status(400).json({ 
        message: 'Recipient, type, title, and message are required' 
      });
    }
    
    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      priority,
      relatedCase,
      relatedDocument,
      actionUrl,
      actionRequired,
      expiresAt,
      metadata
    });
    
    await notification.save();
    await notification.populate('relatedCase', 'title caseNumber');
    await notification.populate('relatedDocument', 'originalName');
    
    // TODO: Trigger real-time notification via Socket.IO
    // io.to(`user_${recipient}`).emit('notification', notification);
    
    res.status(201).json({ 
      success: true, 
      message: 'Notification created successfully',
      notification 
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ 
      message: 'Error creating notification', 
      error: error.message 
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check permissions
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ 
      message: 'Error marking notification as read', 
      error: error.message 
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} notifications marked as read` 
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ 
      message: 'Error marking notifications as read', 
      error: error.message 
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check permissions
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      message: 'Error deleting notification', 
      error: error.message 
    });
  }
};

// Bulk delete notifications
const bulkDeleteNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({ 
        message: 'notificationIds array is required' 
      });
    }
    
    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: req.user.id
    });
    
    res.json({ 
      success: true, 
      message: `${result.deletedCount} notifications deleted` 
    });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({ 
      message: 'Error deleting notifications', 
      error: error.message 
    });
  }
};

// Get notification types and their counts
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { recipient: req.user.id } },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          unread: { 
            $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } 
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const priorityStats = await Notification.aggregate([
      { $match: { recipient: req.user.id, isRead: false } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      typeStats: stats,
      priorityStats
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({ 
      message: 'Error fetching notification stats', 
      error: error.message 
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  bulkDeleteNotifications,
  getNotificationStats
};
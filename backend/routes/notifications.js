const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Get user notifications
router.get('/', auth, notificationController.getNotifications);

// Get unread count
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Create notification (admin/system use)
router.post('/', auth, notificationController.createNotification);

// Mark notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', auth, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', auth, notificationController.deleteNotification);

// Bulk delete notifications
router.delete('/bulk', auth, notificationController.bulkDeleteNotifications);

// Get notification types and their counts
router.get('/stats', auth, notificationController.getNotificationStats);

module.exports = router;
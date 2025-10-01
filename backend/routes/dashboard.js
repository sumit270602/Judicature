const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { checkVerificationStatus } = require('../middleware/verification');

// Apply authentication and verification to all dashboard routes
router.use(auth, checkVerificationStatus);

// Lawyer Dashboard Stats
router.get('/lawyer/stats', dashboardController.getLawyerStats);

// Client Dashboard Stats
router.get('/client/stats', dashboardController.getClientStats);

// Client Recent Activity
router.get('/client/recent-activity', dashboardController.getClientRecentActivity);

// Timeline events for dashboard
router.get('/timeline', dashboardController.getTimeline);

// Get case analytics for lawyers
router.get('/lawyer/analytics', dashboardController.getLawyerAnalytics);

// Get notifications for user
router.get('/notifications', dashboardController.getNotifications);

module.exports = router;
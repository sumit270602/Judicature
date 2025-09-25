const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/cases', require('./cases'));
router.use('/chat', require('./chat'));
router.use('/ai', require('./ai'));
router.use('/verification', require('./verification'));
router.use('/recommendations', require('./recommendations'));
router.use('/dashboard', require('./dashboard'));
router.use('/documents', require('./documents'));
router.use('/notifications', require('./notifications'));
router.use('/search', require('./search'));
router.use('/services', require('./services'));
router.use('/billing', require('./billing'));

// Enhanced Payment System Routes
router.use('/rate-cards', require('./rateCards'));
router.use('/work-items', require('./workItems'));
router.use('/enhanced-billing', require('./enhancedBilling'));

module.exports = router; 

const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/auth', require('./oauth'));
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
router.use('/admin', require('./admin'));

// Enhanced Payment System Routes
router.use('/rate-cards', require('./rateCards'));
router.use('/work-items', require('./workItems'));
router.use('/enhanced-billing', require('./enhancedBilling'));

// Stripe Connect Escrow System Routes
router.use('/stripe-connect', require('./stripeConnect'));
router.use('/orders', require('./orders'));
router.use('/deliverables', require('./deliverables'));
router.use('/webhook', require('./webhook'));

// Payment Request System Routes
router.use('/payment-requests', require('./paymentRequests'));

// Health check route
router.use('/health', require('./health'));

module.exports = router; 
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const stripeConfig = require('../config/stripe');

// Health check endpoint for Stripe configuration
router.get('/health',
  auth,
  roles(['admin']),
  async (req, res) => {
    try {
      const healthStatus = await stripeConfig.stripeHealthCheck();
      res.json({
        success: true,
        stripe: healthStatus
      });
    } catch (error) {
      console.error('Stripe health check error:', error);
      res.status(500).json({
        success: false,
        error: 'Stripe health check failed',
        details: error.message
      });
    }
  }
);

module.exports = router;
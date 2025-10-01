const express = require('express');
const router = express.Router();
const stripeWebhookController = require('../controllers/stripeWebhookController');

// Stripe webhook endpoint
// Note: This route should NOT use express.json() middleware
// Raw body is required for webhook signature verification
router.post('/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookController.handleWebhook
);

module.exports = router;

﻿  const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const billingController = require('../controllers/billingController');

// Get payments (generic endpoint)
router.get('/payments', 
  auth, 
  roles(['client', 'lawyer']), 
  billingController.getPayments || ((req, res) => res.json({ success: true, payments: [] }))  
);

// Get client payments dashboard
router.get('/client/payments', 
  auth, 
  roles(['client']), 
  billingController.getClientPayments || ((req, res) => res.json({ success: true, payments: [] }))
);

// Get lawyer payments dashboard
router.get('/lawyer/payments', 
  auth, 
  roles(['lawyer']), 
  billingController.getLawyerPayments || ((req, res) => res.json({ success: true, payments: [] }))
);

// Create payment order (client creates payment)
router.post('/create-order', 
  auth, 
  roles(['client']), 
  billingController.createPaymentOrder
);

// Verify payment (client verifies payment after gateway)
router.post('/verify-payment', 
  auth, 
  roles(['client']), 
  billingController.verifyPayment
);

// Get payment details
router.get('/payment/:paymentId', 
  auth, 
  roles(['client', 'lawyer']), 
  billingController.getPaymentDetails
);

// Submit work (lawyer)
router.post('/submit-work', 
  auth, 
  roles(['lawyer']), 
  billingController.submitWork
);

// Approve work and release payment (client)
router.post('/approve-work', 
  auth, 
  roles(['client']), 
  billingController.approveWorkAndRelease
);

// Raise dispute (client or lawyer)
router.post('/dispute', 
  auth, 
  roles(['client', 'lawyer']), 
  billingController.raiseDispute
);

module.exports = router;

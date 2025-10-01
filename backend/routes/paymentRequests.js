const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { body, param, query } = require('express-validator');
const paymentRequestController = require('../controllers/paymentRequestController');

// Validation middleware
const createPaymentRequestValidation = [
  body('clientId')
    .notEmpty()
    .withMessage('Client ID is required')
    .isMongoId()
    .withMessage('Invalid client ID'),
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Amount must be at least ₹100'),
  body('serviceType')
    .isIn(['consultation', 'document_review', 'contract_drafting', 'legal_research', 'court_representation', 'legal_notice', 'other'])
    .withMessage('Invalid service type'),
  body('description')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('urgency')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid urgency level'),
  body('estimatedDeliveryDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Estimated delivery days must be between 1 and 365')
];

const respondToRequestValidation = [
  param('requestId')
    .notEmpty()
    .withMessage('Request ID is required'),
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage('Action must be either accept or reject'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// Routes

// Get lawyer's clients (lawyers only)
router.get('/clients',
  auth,
  roles(['lawyer']),
  paymentRequestController.getLawyerClients
);

// Create payment request (lawyers only)
router.post('/',
  auth,
  roles(['lawyer']),
  createPaymentRequestValidation,
  paymentRequestController.createPaymentRequest
);

// Get client payment history (simple mock endpoint)
router.get('/client/payments',
  auth,
  roles(['client']),
  (req, res) => {
    // Mock payment history for now
    res.json({
      success: true,
      payments: []
    });
  }
);

// Get payment requests for current user
router.get('/',
  auth,
  roles(['lawyer', 'client']),
  [
    query('status')
      .optional()
      .isIn(['pending', 'accepted', 'paid', 'completed', 'cancelled', 'rejected'])
      .withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  paymentRequestController.getPaymentRequests
);

// Get single payment request by ID
router.get('/:requestId',
  auth,
  roles(['lawyer', 'client']),
  [
    param('requestId')
      .notEmpty()
      .withMessage('Request ID is required')
  ],
  paymentRequestController.getPaymentRequest
);

// Client responds to payment request (accept/reject)
router.post('/:requestId/respond',
  auth,
  roles(['client']),
  respondToRequestValidation,
  paymentRequestController.respondToPaymentRequest
);

// Client proceeds with payment for accepted request
router.post('/:requestId/pay',
  auth,
  roles(['client']),
  [
    param('requestId')
      .notEmpty()
      .withMessage('Request ID is required')
  ],
  paymentRequestController.proceedWithPayment
);

// Cancel payment request (lawyer only, before client responds)
router.delete('/:requestId',
  auth,
  roles(['lawyer']),
  [
    param('requestId')
      .notEmpty()
      .withMessage('Request ID is required')
  ],
  paymentRequestController.cancelPaymentRequest
);

module.exports = router;
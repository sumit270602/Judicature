
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const { body, param } = require('express-validator');
const ordersController = require('../controllers/ordersController');

// Validation rules
const createOrderValidation = [
  body('lawyerId')
    .isMongoId()
    .withMessage('Valid lawyer ID is required'),
  body('amountCents')
    .isInt({ min: 100 }) // Minimum ₹1.00
    .withMessage('Amount must be at least 100 cents (₹1.00)'),
  body('currency')
    .optional()
    .isIn(['inr', 'usd'])
    .withMessage('Currency must be INR or USD'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('caseId')
    .optional()
    .isMongoId()
    .withMessage('Invalid case ID')
];

const orderIdValidation = [
  param('orderId')
    .matches(/^ORD-[A-Z0-9-]+$/)
    .withMessage('Invalid order ID format')
];

// Create new order with payment intent
router.post('/',
  auth,
  roles(['client']),
  createOrderValidation,
  ordersController.createOrder
);

// Get order details
router.get('/:orderId',
  auth,
  orderIdValidation,
  ordersController.getOrder
);

// List orders for user
router.get('/',
  auth,
  ordersController.listOrders
);

// Release funds to lawyer (client or admin)
router.post('/:orderId/release',
  auth,
  roles(['client', 'admin']),
  orderIdValidation,
  ordersController.releaseFunds
);

// Create dispute (client only)
router.post('/:orderId/dispute',
  auth,
  roles(['client']),
  orderIdValidation,
  [
    body('reason')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Dispute reason must be between 10 and 1000 characters'),
    body('attachments')
      .optional()
      .isArray()
      .withMessage('Attachments must be an array')
  ],
  ordersController.createDispute
);

// Refund order (admin only)
router.post('/:orderId/refund',
  auth,
  roles(['admin']),
  orderIdValidation,
  [
    body('reason')
      .optional()
      .isIn(['duplicate', 'fraudulent', 'requested_by_customer'])
      .withMessage('Invalid refund reason')
  ],
  ordersController.refundOrder
);

module.exports = router;
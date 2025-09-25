const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const enhancedBillingController = require('../controllers/enhancedBillingController');

// Validation middleware
const validatePaymentRequest = [
  body('caseId').isMongoId().withMessage('Valid case ID is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('description').isLength({ min: 10, max: 200 }).withMessage('Description must be 10-200 characters'),
  body('type').optional().isIn(['consultation_fee', 'service_fee', 'court_fee', 'document_fee', 'retainer_fee']).withMessage('Invalid payment type'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date format')
];

const validatePaymentProcess = [
  body('razorpayPaymentId').notEmpty().withMessage('Razorpay payment ID is required'),
  body('razorpayOrderId').notEmpty().withMessage('Razorpay order ID is required'),
  body('razorpaySignature').notEmpty().withMessage('Razorpay signature is required')
];

const validateEscrowRelease = [
  body('releaseReason').isIn(['work_completed', 'milestone_achieved', 'client_approval', 'dispute_resolved']).withMessage('Invalid release reason'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
];

// Create Payment Request (Lawyer only)
router.post('/request', auth, roles(['lawyer']), validatePaymentRequest, enhancedBillingController.createPaymentRequest);

// Process Payment (Client only)
router.post('/:paymentId/process', auth, roles(['client']), validatePaymentProcess, enhancedBillingController.processPayment);

// Release Escrow Payment (Client/Admin only)
router.post('/:paymentId/release-escrow', auth, roles(['client', 'admin']), validateEscrowRelease, enhancedBillingController.releaseEscrowPayment);

// Get Payment Dashboard (Role-based access)
router.get('/dashboard', auth, enhancedBillingController.getPaymentDashboard);

// Generate Invoice
router.get('/:paymentId/invoice', auth, enhancedBillingController.generateInvoice);

module.exports = router;
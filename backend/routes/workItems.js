
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const workItemController = require('../controllers/workItemController');

// Validation middleware
const validateWorkItem = [
  body('caseId').isMongoId().withMessage('Valid case ID is required'),
  body('title').isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').isLength({ min: 10, max: 1000 }).withMessage('Description must be 10-1000 characters'),
  body('workType').isIn(['research', 'drafting', 'consultation', 'court_appearance', 'negotiation', 'review', 'filing', 'other']).withMessage('Invalid work type'),
  body('estimatedHours').optional().isFloat({ min: 0 }).withMessage('Estimated hours must be positive'),
  body('billingRate').optional().isFloat({ min: 0 }).withMessage('Billing rate must be positive'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority')
];

const validateStatusUpdate = [
  body('status').isIn(['pending', 'in_progress', 'completed', 'in_review', 'approved', 'paid', 'revision_required', 'on_hold', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters'),
  body('actualHours').optional().isFloat({ min: 0 }).withMessage('Actual hours must be positive'),
  body('actualAmount').optional().isFloat({ min: 0 }).withMessage('Actual amount must be positive')
];

const validateCommunication = [
  body('message').isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('messageType').optional().isIn(['general', 'update', 'question', 'approval_request', 'revision_request']).withMessage('Invalid message type')
];

// Create Work Item (Lawyer only)
router.post('/', auth, roles(['lawyer']), validateWorkItem, workItemController.createWorkItem);

// Get Work Items (Based on user role)
router.get('/', auth, workItemController.getWorkItems);

// Update Work Item Status
router.patch('/:workItemId/status', auth, validateStatusUpdate, workItemController.updateWorkItemStatus);

// Add Communication to Work Item
router.post('/:workItemId/communication', auth, validateCommunication, workItemController.addWorkItemCommunication);

// Process Auto-Approvals (System/Admin only)
router.post('/auto-approve', auth, roles(['admin']), workItemController.processAutoApprovals);

// Get Work Item Analytics
router.get('/analytics', auth, workItemController.getWorkItemAnalytics);

module.exports = router;
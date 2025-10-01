const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const upload = require('../middleware/upload');
const { body, param } = require('express-validator');
const deliverablesController = require('../controllers/deliverablesController');

// Validation rules
const orderIdValidation = [
  param('orderId')
    .matches(/^ORD-[A-Z0-9-]+$/)
    .withMessage('Invalid order ID format')
];

const deliverableIdValidation = [
  param('deliverableId')
    .isMongoId()
    .withMessage('Invalid deliverable ID')
];

const uploadValidation = [
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('notes')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Notes cannot exceed 2000 characters')
];

// Upload deliverable file (lawyer only)
router.post('/:orderId/upload',
  auth,
  roles(['lawyer']),
  upload.single('deliverable'),
  orderIdValidation,
  uploadValidation,
  deliverablesController.uploadDeliverable
);

// Get deliverables for an order
router.get('/:orderId',
  auth,
  orderIdValidation,
  deliverablesController.getDeliverables
);

// Accept deliverable (client only)
router.post('/:deliverableId/accept',
  auth,
  roles(['client']),
  deliverableIdValidation,
  [
    body('acceptanceNotes')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Acceptance notes cannot exceed 1000 characters')
  ],
  deliverablesController.acceptDeliverable
);

// Reject deliverable (client only)
router.post('/:deliverableId/reject',
  auth,
  roles(['client']),
  deliverableIdValidation,
  [
    body('rejectionReason')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Rejection reason must be between 10 and 1000 characters')
  ],
  deliverablesController.rejectDeliverable
);

// Download deliverable file
router.get('/:deliverableId/download',
  auth,
  deliverableIdValidation,
  deliverablesController.downloadDeliverable
);

// Delete deliverable (lawyer only, if not accepted)
router.delete('/:deliverableId',
  auth,
  roles(['lawyer']),
  deliverableIdValidation,
  deliverablesController.deleteDeliverable
);

module.exports = router;
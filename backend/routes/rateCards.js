const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const rateCardController = require('../controllers/rateCardController');

// Validation middleware
const validateRateCard = [
  body('serviceType').isIn(['consultation', 'case_handling', 'document_review', 'court_representation', 'legal_advice', 'contract_drafting']).withMessage('Invalid service type'),
  body('practiceArea').notEmpty().withMessage('Practice area is required'),
  body('baseRate').isFloat({ min: 0 }).withMessage('Base rate must be a positive number'),
  body('experienceTier').isIn(['junior', 'mid_level', 'senior', 'expert']).withMessage('Invalid experience tier'),
  body('title').isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').isLength({ min: 10, max: 500 }).withMessage('Description must be 10-500 characters')
];

const validateReview = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment must not exceed 500 characters')
];

// Create or Update Rate Card (Lawyer only)
router.post('/', auth, roles(['lawyer']), validateRateCard, rateCardController.createOrUpdateRateCard);

// Get Lawyer's Rate Cards (Lawyer viewing own, or anyone viewing specific lawyer)
router.get('/lawyer/:lawyerId', auth, rateCardController.getLawyerRateCards);
router.get('/lawyer', auth, rateCardController.getLawyerRateCards);

// Search Rate Cards (Public/Client view)
router.get('/search', rateCardController.searchRateCards);

// Get Rate Card Details with Reviews
router.get('/details/:rateCardId', rateCardController.getRateCardDetails);

// Bulk Update Rate Cards (Lawyer only)
router.patch('/bulk-update', auth, roles(['lawyer']), rateCardController.bulkUpdateRateCards);

// Delete Rate Card (Soft delete - Lawyer only)
router.delete('/:rateCardId', auth, roles(['lawyer']), rateCardController.deleteRateCard);

// Add Review to Rate Card (Client only)
router.post('/:rateCardId/review', auth, roles(['client']), validateReview, rateCardController.addRateCardReview);

// Get Rate Comparison
router.get('/compare', rateCardController.getRateComparison);

module.exports = router;
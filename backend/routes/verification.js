const express = require('express');
const router = express.Router();
const {
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationDetails
} = require('../controllers/verificationController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');

// Lawyer verification routes (protected, lawyer-only)
router.get('/status', auth, requireRole(['lawyer']), getVerificationStatus);

// Admin verification management routes (protected, admin-only)
router.get('/pending', auth, requireRole(['admin']), getPendingVerifications);
router.get('/details/:lawyerId', auth, requireRole(['admin']), getVerificationDetails);
router.put('/approve/:lawyerId', auth, requireRole(['admin']), approveVerification);
router.put('/reject/:lawyerId', auth, requireRole(['admin']), rejectVerification);

module.exports = router;
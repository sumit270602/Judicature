
const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');
const auth = require('../middleware/auth');
const { checkVerificationStatus, requireVerificationForCaseActions } = require('../middleware/verification');
const upload = require('../middleware/upload');

// Apply verification status checking to all case routes
router.use(auth, checkVerificationStatus);

router.post('/', requireVerificationForCaseActions, caseController.createCase);
router.get('/', caseController.getCases);
router.get('/:id', caseController.getCaseById);
router.put('/:id', requireVerificationForCaseActions, caseController.updateCase);
router.delete('/:id', requireVerificationForCaseActions, caseController.deleteCase);
router.post('/:id/assign-lawyer', requireVerificationForCaseActions, caseController.assignLawyer);

// Work completion and case resolution routes
router.post('/:id/upload-proof', 
  requireVerificationForCaseActions, 
  upload.single('workProof'), 
  caseController.uploadWorkProof
);
router.post('/:id/resolve', 
  requireVerificationForCaseActions, 
  caseController.resolveCase
);

module.exports = router; 
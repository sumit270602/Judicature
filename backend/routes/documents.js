const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');

// Upload verification document (for lawyers)
router.post('/verification/upload', auth, documentController.upload.single('document'), documentController.uploadVerificationDoc);

// Upload case document  
router.post('/case/upload', auth, documentController.upload.single('document'), documentController.uploadCaseDoc);

// Get user's documents
router.get('/my-documents', auth, documentController.getUserDocs);

// Get case documents
router.get('/case/:caseId', auth, documentController.getCaseDocs);

// Download document
router.get('/download/:documentId', auth, documentController.downloadDoc);

module.exports = router;


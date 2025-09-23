const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const {
  getPendingDocs,
  approveDoc,
  rejectDoc
} = require('../controllers/adminDocumentController');
const { downloadDoc } = require('../controllers/documentController');

// Admin document routes
router.get('/documents/pending', 
  auth, 
  requireRole(['admin']),
  getPendingDocs
);

router.post('/documents/approve/:documentId', 
  auth, 
  requireRole(['admin']),
  approveDoc
);

router.post('/documents/reject/:documentId', 
  auth, 
  requireRole(['admin']),
  rejectDoc
);

// Admin can download any document for review
router.get('/documents/download/:documentId', 
  auth, 
  requireRole(['admin']),
  downloadDoc
);

module.exports = router;
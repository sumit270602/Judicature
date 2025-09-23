const Document = require('../models/Document');
const User = require('../models/User');
const Case = require('../models/Case');
const multer = require('multer');

// Simple multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Upload verification document (for lawyers)
const uploadVerificationDoc = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Only lawyers can upload verification documents' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType } = req.body;
    if (!['bar_certificate', 'license', 'identity'].includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const document = new Document({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileData: req.file.buffer,
      documentType: documentType,
      isVerificationDoc: true,
      uploadedBy: req.user.id
    });

    await document.save();

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      documentId: document._id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload case document
const uploadCaseDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { caseId } = req.body;
    if (!caseId) {
      return res.status(400).json({ message: 'Case ID required' });
    }

    // Check case permission
    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const hasPermission = 
      req.user.role === 'admin' ||
      caseItem.client.toString() === req.user.id ||
      (caseItem.lawyer && caseItem.lawyer.toString() === req.user.id);

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const document = new Document({
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileData: req.file.buffer,
      documentType: 'case_document',
      isVerificationDoc: false,
      uploadedBy: req.user.id,
      relatedCase: caseId,
      status: 'pending' // Case docs need admin approval
    });

    await document.save();

    // Add to case
    caseItem.documents.push(document._id);
    await caseItem.save();

    res.status(201).json({
      success: true,
      message: 'Case document uploaded successfully',
      documentId: document._id
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's documents
const getUserDocs = async (req, res) => {
  try {
    const documents = await Document.getUserDocs(req.user.id);
    
    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id,
        name: doc.originalName,
        type: doc.documentType,
        status: doc.status,
        uploadedAt: doc.createdAt,
        isVerificationDoc: doc.isVerificationDoc
      }))
    });

  } catch (error) {
    console.error('Get docs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get case documents
const getCaseDocs = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseItem = await Case.findById(caseId);
    if (!caseItem) {
      return res.status(404).json({ message: 'Case not found' });
    }

    // Check permission
    const hasPermission = 
      req.user.role === 'admin' ||
      caseItem.client.toString() === req.user.id ||
      (caseItem.lawyer && caseItem.lawyer.toString() === req.user.id);

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await Document.getCaseDocs(caseId);
    
    // Filter documents based on user role
    const filteredDocs = req.user.role === 'admin' 
      ? documents // Admins see all documents
      : documents.filter(doc => doc.status === 'approved'); // Users only see approved docs
    
    res.json({
      success: true,
      documents: filteredDocs.map(doc => ({
        id: doc._id,
        name: doc.originalName,
        uploadedBy: doc.uploadedBy.name,
        uploadedAt: doc.createdAt,
        status: doc.status
      }))
    });

  } catch (error) {
    console.error('Get case docs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download document
const downloadDoc = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId).populate('relatedCase');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check permission
    let hasPermission = false;
    if (document.isVerificationDoc) {
      hasPermission = document.uploadedBy.toString() === req.user.id || req.user.role === 'admin';
    } else {
      hasPermission = req.user.role === 'admin' ||
        document.relatedCase.client.toString() === req.user.id ||
        (document.relatedCase.lawyer && document.relatedCase.lawyer.toString() === req.user.id);
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // For case documents, non-admin users can only download approved documents
    if (!document.isVerificationDoc && req.user.role !== 'admin' && document.status !== 'approved') {
      return res.status(403).json({ message: 'Document not yet approved for download' });
    }

    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.originalName}"`
    });

    res.send(document.fileData);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  upload,
  uploadVerificationDoc,
  uploadCaseDoc,
  getUserDocs,
  getCaseDocs,
  downloadDoc
};
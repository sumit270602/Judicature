const Document = require('../models/Document');
const Case = require('../models/Case');
const multer = require('multer');

// Simple multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

// Upload verification document (for lawyers)
const uploadVerificationDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { documentType } = req.body;

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${req.user.id}_${documentType}_${timestamp}`;

    const document = new Document({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileData: req.file.buffer,
      documentType: documentType || 'verification_document',
      isVerificationDoc: true,
      uploadedBy: req.user.id
    });

    try {
      await document.save();
    } catch (saveError) {
      // Handle duplicate key error by generating a new unique filename
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.fileName) {
        console.log('Duplicate filename detected, generating new unique filename...');
        const newTimestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 12);
        document.fileName = `${req.user.id}_${documentType}_${newTimestamp}_${randomString}`;
        await document.save();
      } else {
        throw saveError;
      }
    }

    res.json({
      success: true,
      message: 'Document uploaded',
      documentId: document._id
    });

  } catch (error) {
    // res.status(500).json({ message: 'Server error' });
    res.status(500).json({ message: error.message });

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

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `case_${caseId}_${req.user.id}_${timestamp}`;

    const document = new Document({
      originalName: req.file.originalname,
      fileName: fileName,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      fileData: req.file.buffer,
      documentType: 'case_document',
      isVerificationDoc: false,
      uploadedBy: req.user.id,
      relatedCase: caseId,
      status: 'pending' // Case docs need admin approval
    });

    try {
      await document.save();
    } catch (saveError) {
      // Handle duplicate key error by generating a new unique filename
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.fileName) {
        console.log('Duplicate filename detected, generating new unique filename...');
        const newTimestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 12);
        document.fileName = `case_${caseId}_${req.user.id}_${newTimestamp}_${randomString}`;
        await document.save();
      } else {
        throw saveError;
      }
    }

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
    
    // Filter documents based on user role and ownership
    const filteredDocs = req.user.role === 'admin' 
      ? documents // Admins see all documents
      : documents.filter(doc => 
          doc.status === 'approved' || // Approved docs visible to all case participants
          doc.uploadedBy._id.toString() === req.user.id // Users can see their own uploads
        );
    
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

    console.log('Download request - documentId:', documentId);
    console.log('Document found:', !!document);
    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    

    // Check permission - temporarily allow document uploader to download their own uploads
    let hasPermission = false;
    
    // Allow admin to download anything
    if (req.user.role === 'admin') {
      hasPermission = true;
      console.log('Admin access granted');
    }
    // Allow user to download their own uploads
    else if (document.uploadedBy.toString() === req.user.id) {
      hasPermission = true;
      console.log('Uploader access granted');
    }
    // For verification docs
    else if (document.isVerificationDoc) {
      hasPermission = false;
      console.log('Verification doc - access denied (not uploader or admin)');
    } 
    // For case docs, check case permissions
    else {
      if (!document.relatedCase) {
        console.log('No related case found for document');
        return res.status(403).json({ message: 'Document has no related case' });
      }
      
      console.log('Related case client:', document.relatedCase.client);
      console.log('Related case lawyer:', document.relatedCase.lawyer);
      
      hasPermission = document.relatedCase.client.toString() === req.user.id ||
        (document.relatedCase.lawyer && document.relatedCase.lawyer.toString() === req.user.id);
      
      console.log('Case doc permission check:', hasPermission);
    }

    if (!hasPermission) {
      console.log('Access denied - permission check failed');
      return res.status(403).json({ message: 'Access denied' });
    }

    // For case documents, check approval status (temporarily disabled for debugging)
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
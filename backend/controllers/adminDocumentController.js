const Document = require('../models/Document');
const User = require('../models/User');

// Get pending verification documents
const getPendingDocs = async (req, res) => {
  try {
    const documents = await Document.getPendingDocs()
      .populate('relatedCase', 'title caseNumber');

    res.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc._id,
        name: doc.originalName,
        type: doc.documentType,
        isVerificationDoc: doc.isVerificationDoc,
        uploadedBy: {
          id: doc.uploadedBy._id,
          name: doc.uploadedBy.name,
          email: doc.uploadedBy.email
        },
        relatedCase: doc.relatedCase ? {
          id: doc.relatedCase._id,
          title: doc.relatedCase.title,
          caseNumber: doc.relatedCase.caseNumber
        } : null,
        uploadedAt: doc.createdAt,
        size: doc.fileSize
      }))
    });

  } catch (error) {
    console.error('Get pending docs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve document
const approveDoc = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId).populate('uploadedBy');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'pending') {
      return res.status(400).json({ message: 'Document already reviewed' });
    }

    // Update document
    document.status = 'approved';
    document.reviewedBy = req.user.id;
    document.reviewedAt = new Date();
    await document.save();

    // Update user verification status ONLY if this is a verification doc
    if (document.isVerificationDoc) {
      const user = await User.findById(document.uploadedBy._id);
      
      // Check if all verification docs are approved
      const userDocs = await Document.find({
        uploadedBy: user._id,
        isVerificationDoc: true
      });

      const allApproved = userDocs.every(doc => doc.status === 'approved');
      
      if (allApproved) {
        user.verificationStatus = 'verified';
        await user.save();
      }
    }

    res.json({
      success: true,
      message: `${document.isVerificationDoc ? 'Verification' : 'Case'} document approved successfully`,
      documentType: document.isVerificationDoc ? 'verification' : 'case'
    });

  } catch (error) {
    console.error('Approve doc error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject document
const rejectDoc = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { reason } = req.body;

    const document = await Document.findById(documentId).populate('uploadedBy');
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (document.status !== 'pending') {
      return res.status(400).json({ message: 'Document already reviewed' });
    }

    // Update document
    document.status = 'rejected';
    document.reviewedBy = req.user.id;
    document.reviewedAt = new Date();
    document.reviewNotes = reason || 'Document rejected';
    await document.save();

    res.json({
      success: true,
      message: `${document.isVerificationDoc ? 'Verification' : 'Case'} document rejected successfully`,
      documentType: document.isVerificationDoc ? 'verification' : 'case'
    });

  } catch (error) {
    console.error('Reject doc error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getPendingDocs,
  approveDoc,
  rejectDoc
};
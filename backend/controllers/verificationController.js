const User = require('../models/User');
const cloudinary = require('../utils/cloudinary');

// Submit verification documents
const submitVerificationDocuments = async (req, res) => {
  try {
    const { documents } = req.body;
    const userId = req.user.id;

    // Check if user is a lawyer
    const user = await User.findById(userId);
    if (!user || user.role !== 'lawyer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only lawyers can submit verification documents' 
      });
    }

    // Check if already verified
    if (user.verificationStatus === 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: 'User is already verified' 
      });
    }

    // Validate documents array
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one document is required' 
      });
    }

    // Validate document types
    const allowedTypes = ['bar_certificate', 'license', 'identity', 'practice_certificate'];
    const invalidDocs = documents.filter(doc => !allowedTypes.includes(doc.type));
    
    if (invalidDocs.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid document types provided' 
      });
    }

    // Update user with new documents
    const newDocuments = documents.map(doc => ({
      type: doc.type,
      url: doc.url,
      originalName: doc.originalName || 'Document',
      uploadedAt: new Date(),
      status: 'pending'
    }));

    // Remove existing documents of the same type
    user.verificationDocuments = user.verificationDocuments.filter(
      existingDoc => !documents.some(newDoc => newDoc.type === existingDoc.type)
    );

    // Add new documents
    user.verificationDocuments.push(...newDocuments);
    user.verificationStatus = 'under_review';
    user.verificationRequestedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Documents submitted successfully for verification',
      data: {
        verificationStatus: user.verificationStatus,
        documentsUploaded: newDocuments.length,
        progress: user.getVerificationProgress()
      }
    });

  } catch (error) {
    console.error('Submit verification documents error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during document submission' 
    });
  }
};

// Get verification status
const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (user.role !== 'lawyer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only lawyers have verification status' 
      });
    }

    const verificationData = {
      status: user.verificationStatus,
      isVerified: user.isVerified,
      documents: user.verificationDocuments.map(doc => ({
        type: doc.type,
        originalName: doc.originalName,
        uploadedAt: doc.uploadedAt,
        status: doc.status
      })),
      verificationNotes: user.verificationNotes,
      verifiedAt: user.verifiedAt,
      verificationRequestedAt: user.verificationRequestedAt,
      progress: user.getVerificationProgress()
    };

    res.status(200).json({
      success: true,
      data: verificationData
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching verification status' 
    });
  }
};

// Admin: Get pending verifications
const getPendingVerifications = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pendingUsers = await User.find({
      role: 'lawyer',
      verificationStatus: { $in: ['pending', 'under_review'] }
    })
    .select('-password')
    .sort({ verificationRequestedAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await User.countDocuments({
      role: 'lawyer',
      verificationStatus: { $in: ['pending', 'under_review'] }
    });

    res.status(200).json({
      success: true,
      data: {
        verifications: pendingUsers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching pending verifications' 
    });
  }
};

// Admin: Approve verification
const approveVerification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { lawyerId } = req.params;
    const { notes } = req.body;

    const lawyer = await User.findById(lawyerId);
    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Lawyer not found' 
      });
    }

    if (lawyer.verificationStatus === 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: 'Lawyer is already verified' 
      });
    }

    // Update verification status
    lawyer.verificationStatus = 'verified';
    lawyer.isVerified = true;
    lawyer.verifiedAt = new Date();
    lawyer.verifiedBy = req.user.id;
    lawyer.verificationNotes = notes || 'Verification approved';
    
    // Mark all documents as approved
    lawyer.verificationDocuments.forEach(doc => {
      doc.status = 'approved';
    });

    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Lawyer verification approved successfully',
      data: {
        lawyerId: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        verificationStatus: lawyer.verificationStatus,
        verifiedAt: lawyer.verifiedAt
      }
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification approval' 
    });
  }
};

// Admin: Reject verification
const rejectVerification = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { lawyerId } = req.params;
    const { notes, rejectedDocuments } = req.body;

    if (!notes) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    const lawyer = await User.findById(lawyerId);
    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Lawyer not found' 
      });
    }

    if (lawyer.verificationStatus === 'verified') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reject already verified lawyer' 
      });
    }

    // Update verification status
    lawyer.verificationStatus = 'rejected';
    lawyer.isVerified = false;
    lawyer.verificationNotes = notes;
    
    // Mark specific documents as rejected if provided
    if (rejectedDocuments && Array.isArray(rejectedDocuments)) {
      lawyer.verificationDocuments.forEach(doc => {
        if (rejectedDocuments.includes(doc.type)) {
          doc.status = 'rejected';
        }
      });
    } else {
      // Mark all documents as rejected
      lawyer.verificationDocuments.forEach(doc => {
        doc.status = 'rejected';
      });
    }

    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Lawyer verification rejected',
      data: {
        lawyerId: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        verificationStatus: lawyer.verificationStatus,
        rejectionReason: notes
      }
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification rejection' 
    });
  }
};

// Admin: Get verification details
const getVerificationDetails = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { lawyerId } = req.params;

    const lawyer = await User.findById(lawyerId)
      .select('-password')
      .populate('verifiedBy', 'name email');

    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Lawyer not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: {
        lawyer: {
          id: lawyer._id,
          name: lawyer.name,
          email: lawyer.email,
          phone: lawyer.phone,
          barCouncilId: lawyer.barCouncilId,
          practiceAreas: lawyer.practiceAreas,
          experience: lawyer.experience,
          verificationStatus: lawyer.verificationStatus,
          documents: lawyer.verificationDocuments,
          verificationNotes: lawyer.verificationNotes,
          verifiedAt: lawyer.verifiedAt,
          verifiedBy: lawyer.verifiedBy,
          verificationRequestedAt: lawyer.verificationRequestedAt,
          createdAt: lawyer.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get verification details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching verification details' 
    });
  }
};

module.exports = {
  submitVerificationDocuments,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationDetails
};
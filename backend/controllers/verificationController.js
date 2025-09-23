const User = require('../models/User');

// Get verification status
const getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select('-password');
    
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

    const Document = require('../models/Document');
    const documents = await Document.find({ 
      uploadedBy: userId, 
      isVerificationDoc: true 
    }).sort({ createdAt: -1 });

    const verificationData = {
      status: user.verificationStatus,
      documents: documents.map(doc => ({
        id: doc._id,
        type: doc.documentType,
        originalName: doc.originalName,
        uploadedAt: doc.createdAt,
        status: doc.status,
        reviewNotes: doc.reviewNotes,
        reviewedAt: doc.reviewedAt
      })),
      verificationRequestedAt: user.createdAt
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
    await lawyer.save();

    res.status(200).json({
      success: true,
      message: 'Lawyer verification rejected',
      data: {
        lawyerId: lawyer._id,
        name: lawyer.name,
        email: lawyer.email,
        verificationStatus: lawyer.verificationStatus,
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
      .select('-password');

    if (!lawyer || lawyer.role !== 'lawyer') {
      return res.status(404).json({ 
        success: false, 
        message: 'Lawyer not found' 
      });
    }

    // Get lawyer's verification documents
    const Document = require('../models/Document');
    const documents = await Document.find({ 
      uploadedBy: lawyerId, 
      isVerificationDoc: true 
    }).sort({ createdAt: -1 });

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
          createdAt: lawyer.createdAt
        },
        documents: documents.map(doc => ({
          id: doc._id,
          type: doc.documentType,
          originalName: doc.originalName,
          uploadedAt: doc.createdAt,
          status: doc.status,
          reviewNotes: doc.reviewNotes
        }))
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
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationDetails
};
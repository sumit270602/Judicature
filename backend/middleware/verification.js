
const User = require('../models/User');

// Middleware to check if lawyer is verified before allowing certain actions
const requireVerifiedLawyer = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user is a lawyer
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ 
        success: false, 
        message: 'This action is restricted to lawyers only' 
      });
    }

    // Get full user data from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if lawyer is verified
    if (!user.canTakeCases()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Lawyer verification required to perform this action',
        verificationStatus: user.verificationStatus
      });
    }

    // Add verification info to request for use in controllers
    req.verifiedLawyer = user;
    next();

  } catch (error) {
    console.error('Verification middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification check' 
    });
  }
};

// Middleware to check verification status (allows pending/under_review but provides warning)
const checkVerificationStatus = async (req, res, next) => {
  try {
    // Only apply to lawyers
    if (!req.user || req.user.role !== 'lawyer') {
      return next();
    }

    // Get full user data from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Add verification warning headers for frontend
    if (user.verificationStatus === 'pending') {
      res.set('X-Verification-Warning', 'Verification documents pending submission');
    } else if (user.verificationStatus === 'under_review') {
      res.set('X-Verification-Warning', 'Verification under admin review');
    } else if (user.verificationStatus === 'rejected') {
      res.set('X-Verification-Warning', 'Verification rejected - please resubmit documents');
    }

    // Add verification info to request
    req.verificationInfo = {
      status: user.verificationStatus,
      canTakeCases: user.canTakeCases()
    };

    next();

  } catch (error) {
    console.error('Verification status middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification status check' 
    });
  }
};

// Middleware to prevent unverified lawyers from taking certain case actions
const requireVerificationForCaseActions = async (req, res, next) => {
  try {
    // Only apply to lawyers
    if (!req.user || req.user.role !== 'lawyer') {
      return next();
    }

    // Get full user data from database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check specific actions that require verification
    const restrictedActions = ['create', 'accept', 'update_status'];
    const action = req.body?.action || req.params?.action || req.query?.action;

    // Also check for specific endpoint actions
    const currentPath = req.path || req.url || '';
    const isUploadProof = currentPath.includes('upload-proof');
    const isResolveCase = currentPath.includes('resolve');
    const isRestrictedEndpoint = isUploadProof || isResolveCase;

    // Check if action is restricted or if it's a restricted endpoint
    const isRestrictedAction = action && restrictedActions.includes(action);
    
    if ((isRestrictedAction || isRestrictedEndpoint) && !user.canTakeCases()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Verified lawyer status required for this case action',
        verificationStatus: user.verificationStatus,
        requiredAction: 'Complete lawyer verification process'
      });
    }

    next();

  } catch (error) {
    console.error('Case action verification middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during case action verification' 
    });
  }
};

// Middleware for admin to verify access to verification management
const requireAdminForVerification = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required for verification management' 
      });
    }

    next();

  } catch (error) {
    console.error('Admin verification middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during admin verification' 
    });
  }
};

module.exports = {
  requireVerifiedLawyer,
  checkVerificationStatus,
  requireVerificationForCaseActions,
  requireAdminForVerification
};
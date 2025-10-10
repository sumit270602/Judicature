
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role,
      // Lawyer-specific fields
      barCouncilId,
      practiceAreas,
      experience,
      hourlyRate,
      bio,
      phone,
      address
    } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['client', 'lawyer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Additional validation for lawyers
    if (role === 'lawyer') {
      if (!barCouncilId || !phone) {
        return res.status(400).json({ 
          message: 'Bar Council ID and phone number are required for lawyers' 
        });
      }
      if (!practiceAreas || !Array.isArray(practiceAreas) || practiceAreas.length === 0) {
        return res.status(400).json({ 
          message: 'Please select at least one practice area' 
        });
      }
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user data object
    const userData = { 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword, 
      role 
    };

    // Add lawyer-specific fields if role is lawyer
    if (role === 'lawyer') {
      userData.barCouncilId = barCouncilId.trim();
      userData.practiceAreas = practiceAreas;
      userData.experience = parseInt(experience) || 0;
      userData.hourlyRate = parseInt(hourlyRate) || 0;
      userData.bio = bio ? bio.trim() : '';
      userData.phone = phone.trim();
      userData.address = address ? address.trim() : '';
    }
    
    // Create user
    user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    res.status(201).json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        verificationStatus: user.verificationStatus,
        canTakeCases: user.canTakeCases()
      } 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Special handling for lawyers with rejected verification
    if (user.role === 'lawyer' && user.verificationStatus === 'rejected') {
      // Send login notification even for rejected lawyers
      try {
        const emailService = require('../utils/emailService');
        const loginDetails = {
          ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
          userAgent: req.get('User-Agent') || 'Unknown',
          location: req.get('CF-IPCountry') || 'Unknown',
          timestamp: new Date().toLocaleString()
        };

        await emailService.sendLoginNotification(user.email, user.name, loginDetails);
      } catch (emailError) {
        console.error('Failed to send login notification email:', emailError);
      }

      return res.status(200).json({ 
        success: true,
        token: jwt.sign(
          { id: user._id, role: user.role }, 
          process.env.JWT_SECRET, 
          { expiresIn: '7d' }
        ), 
        user: { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role,
          phone: user.phone,
          address: user.address,
          verificationStatus: user.verificationStatus,
          canTakeCases: false
        },
        message: 'Login successful, but verification was rejected. Please resubmit documents.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Send login notification email
    try {
      const emailService = require('../utils/emailService');
      const loginDetails = {
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        userAgent: req.get('User-Agent') || 'Unknown',
        location: req.get('CF-IPCountry') || 'Unknown', // Cloudflare header, can be enhanced with IP geolocation
        timestamp: new Date().toLocaleString()
      };

      await emailService.sendLoginNotification(user.email, user.name, loginDetails);
    } catch (emailError) {
      console.error('Failed to send login notification email:', emailError);
      // Don't fail login if email fails
    }

    // Return user data (without password)
    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        address: user.address,
        verificationStatus: user.verificationStatus,
        canTakeCases: user.canTakeCases()
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ Auth/me - Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password - send reset token
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ 
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiration (1 hour)
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Send reset email
    try {
      const emailService = require('../utils/emailService');
      await emailService.sendForgotPasswordEmail(user.email, user.name, resetToken);
      
      res.json({ 
        success: true, 
        message: 'Password reset link sent to your email' 
      });
    } catch (emailError) {
      // Remove reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      console.error('Failed to send password reset email:', emailError);
      res.status(500).json({ 
        message: 'Failed to send reset email. Please try again.' 
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error during password reset request' });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Hash the token to compare with stored hash
    const crypto = require('crypto');
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new JWT token
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true, 
      message: 'Password reset successfully',
      token: jwtToken,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        verificationStatus: user.verificationStatus,
        canTakeCases: user.canTakeCases()
      }
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error during password reset' });
  }
}; 
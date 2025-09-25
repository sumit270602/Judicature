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
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
}; 
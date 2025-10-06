const User = require('../models/User');
const { updateLawyerVector } = require('./recommendationController');

exports.getUsers = async (req, res) => {
  try {
    const { 
      role, 
      search, 
      page = 1, 
      limit = 10,
      isVerified
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    // Build filter query
    let filter = {};
    
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null }
      ].filter(Boolean);
    }
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const Case = require('../models/Case');
    const Order = require('../models/Order');
    const Payment = require('../models/Payment');
    
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let cases = [];
    let orders = [];
    let payments = [];
    
    if (user.role === 'client') {
      cases = await Case.find({ client: user._id })
        .populate('lawyer', 'name email')
        .populate('assignedLawyer', 'name email')
        .sort({ createdAt: -1 });
      
      orders = await Order.find({ client: user._id })
        .populate('lawyer', 'name email')
        .sort({ createdAt: -1 });
        
      payments = await Payment.find({ client: user._id })
        .sort({ createdAt: -1 });
        
    } else if (user.role === 'lawyer') {
      cases = await Case.find({ 
        $or: [
          { lawyer: user._id },
          { assignedLawyer: user._id }
        ]
      })
        .populate('client', 'name email')
        .sort({ createdAt: -1 });
      
      orders = await Order.find({ lawyer: user._id })
        .populate('client', 'name email')
        .sort({ createdAt: -1 });
        
      payments = await Payment.find({ lawyer: user._id })
        .sort({ createdAt: -1 });
    }
    
    const stats = {
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'active').length,
      completedCases: cases.filter(c => c.status === 'completed').length,
      pendingCases: cases.filter(c => c.status === 'pending').length,
      totalOrders: orders.length,
      totalEarnings: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    };
    
    res.json({
      user,
      cases,
      orders,
      payments,
      stats
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    
    // Update Redis vector if this is a lawyer
    if (updated.role === 'lawyer') {
      await updateLawyerVector(updated._id.toString(), updated);
    }
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateLawyerProfile = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const {
      name,
      email,
      phone,
      address,
      barCouncilId,
      practiceAreas,
      experience,
      hourlyRate,
      bio
    } = req.body;

    // Validate required fields for lawyers
    if (!name || !email || !barCouncilId) {
      return res.status(400).json({ 
        message: 'Name, email, and Bar Council ID are required' 
      });
    }

    // Validate Bar Council ID format if provided
    if (barCouncilId && !/^[A-Z]{2}\/\d{4,6}\/\d{4}$/.test(barCouncilId)) {
      return res.status(400).json({ 
        message: 'Invalid Bar Council ID format. Expected format: XX/XXXXXX/YYYY' 
      });
    }

    // Validate practice areas
    const validPracticeAreas = [
      'civil', 'criminal', 'family', 'corporate', 'property', 
      'labor', 'tax', 'constitutional', 'intellectual', 'other'
    ];
    
    if (practiceAreas && practiceAreas.some(area => !validPracticeAreas.includes(area))) {
      return res.status(400).json({ 
        message: 'Invalid practice area provided' 
      });
    }

    const updateData = {
      name,
      email,
      phone,
      address,
      barCouncilId,
      practiceAreas: practiceAreas || [],
      experience: parseInt(experience) || 0,
      hourlyRate: parseInt(hourlyRate) || 0,
      bio
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update vector database if this is a lawyer
    if (updatedUser.role === 'lawyer') {
      await updateLawyerVector(updatedUser._id.toString(), updatedUser);
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating lawyer profile:', err);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('🔍 Getting profile for user ID:', req.user?.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('❌ User not found for ID:', req.user.id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    console.log('✅ Profile found for user:', user.name, '|', user.email);
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name, 
        email, 
        phone, 
        address,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Update vector database if this is a lawyer
    if (updatedUser.role === 'lawyer') {
      await updateLawyerVector(updatedUser._id.toString(), updatedUser);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
};

// Get notification settings
exports.getNotificationSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationSettings');
    
    const defaultSettings = {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      caseUpdates: true,
      paymentReminders: true,
      courtDates: true,
      messageNotifications: true
    };

    const settings = user?.notificationSettings || defaultSettings;

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        notificationSettings: req.body,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('notificationSettings');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: updatedUser.notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update notification settings',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
}; 
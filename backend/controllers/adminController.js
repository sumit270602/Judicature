const User = require('../models/User');
const Case = require('../models/Case');
const Payment = require('../models/Payment');
const PaymentRequest = require('../models/PaymentRequest');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const LegalService = require('../models/LegalService');
const TransactionAudit = require('../models/TransactionAudit');
const TimeTracking = require('../models/TimeTracking');
const WorkItem = require('../models/WorkItem');
const Invoice = require('../models/Invoice');
const Payout = require('../models/Payout');

// Admin Dashboard Overview Stats
exports.getAdminOverview = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // User Statistics
    const totalUsers = await User.countDocuments();
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const verifiedLawyers = await User.countDocuments({ role: 'lawyer', verificationStatus: 'verified' });
    const pendingVerifications = await User.countDocuments({ role: 'lawyer', verificationStatus: 'pending' });
    const activeUsersToday = await User.countDocuments({
      lastActive: { $gte: startOfDay }
    });

    // Case Statistics
    const totalCases = await Case.countDocuments();
    const activeCases = await Case.countDocuments({ status: 'active' });
    const completedCases = await Case.countDocuments({ 
      status: { $in: ['resolved', 'completed', 'closed'] } 
    });
    const casesThisMonth = await Case.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Financial Statistics
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await PaymentRequest.countDocuments({ status: 'pending' });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });

    // Platform Health Metrics
    const errorNotifications = await Notification.countDocuments({
      type: 'error',
      createdAt: { $gte: startOfDay }
    });

    const systemAlerts = await Notification.countDocuments({
      type: 'system_alert',
      read: false
    });

    res.json({
      users: {
        total: totalUsers,
        lawyers: totalLawyers,
        clients: totalClients,
        verifiedLawyers,
        pendingVerifications,
        activeToday: activeUsersToday
      },
      cases: {
        total: totalCases,
        active: activeCases,
        completed: completedCases,
        thisMonth: casesThisMonth
      },
      financial: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        pendingPayments,
        totalOrders,
        completedOrders
      },
      system: {
        errorNotifications,
        systemAlerts,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Note: User management functions are handled by userController.js
// Use userController.getUsers(), userController.getUserById(), etc.

// User Activity and Analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Daily user registrations for the last 30 days
    const dailyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // User role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Active users by day
    const activeUsersByDay = await User.aggregate([
      {
        $match: {
          lastActive: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$lastActive' },
            month: { $month: '$lastActive' },
            day: { $dayOfMonth: '$lastActive' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      dailyRegistrations,
      roleDistribution,
      activeUsersByDay
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Case Management and Analytics
exports.getCaseAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Cases by status
    const casesByStatus = await Case.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Cases by category/type
    const casesByCategory = await Case.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily case creation for last 30 days
    const dailyCaseCreation = await Case.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Average case resolution time
    const resolvedCases = await Case.find({
      status: { $in: ['resolved', 'completed', 'closed'] },
      createdAt: { $exists: true },
      updatedAt: { $exists: true }
    });

    let totalResolutionTime = 0;
    resolvedCases.forEach(case_ => {
      totalResolutionTime += (case_.updatedAt - case_.createdAt);
    });
    
    const averageResolutionDays = resolvedCases.length > 0 
      ? Math.round(totalResolutionTime / (resolvedCases.length * 24 * 60 * 60 * 1000))
      : 0;

    res.json({
      casesByStatus,
      casesByCategory,
      dailyCaseCreation,
      averageResolutionDays,
      totalCases: await Case.countDocuments()
    });
  } catch (error) {
    console.error('Error fetching case analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Financial Analytics and Management
exports.getFinancialAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Daily revenue for last 30 days
    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Payment methods distribution
    const paymentMethods = await Payment.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    // Pending financial operations
    const pendingOperations = {
      paymentRequests: await PaymentRequest.countDocuments({ status: 'pending' }),
      pendingPayouts: await Payout.countDocuments({ status: 'pending' }),
      disputedPayments: await Payment.countDocuments({ status: 'disputed' })
    };

    // Monthly financial summary
    const monthlyStats = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    res.json({
      dailyRevenue,
      paymentMethods,
      pendingOperations,
      monthlyStats: monthlyStats[0] || { totalRevenue: 0, transactionCount: 0, averageTransaction: 0 }
    });
  } catch (error) {
    console.error('Error fetching financial analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Platform Performance and System Health
exports.getSystemHealth = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // System notifications and alerts
    const systemNotifications = await Notification.find({
      type: { $in: ['system_alert', 'error', 'warning'] },
      createdAt: { $gte: oneDayAgo }
    }).sort({ createdAt: -1 }).limit(20);

    // Error rates
    const errorCount = await Notification.countDocuments({
      type: 'error',
      createdAt: { $gte: oneHourAgo }
    });

    // Database statistics
    const dbStats = {
      users: await User.countDocuments(),
      cases: await Case.countDocuments(),
      payments: await Payment.countDocuments(),
      notifications: await Notification.countDocuments()
    };

    // Active sessions (approximate based on recent activity)
    const activeSessions = await User.countDocuments({
      lastActive: { $gte: oneHourAgo }
    });

    res.json({
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      processId: process.pid,
      systemNotifications,
      errorCount,
      dbStats,
      activeSessions,
      timestamp: now
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// User Actions (Activate/Deactivate/Verify)
exports.toggleUserStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const { active } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { active },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log admin action (could be replaced with proper audit logging system)
    console.log(`Admin ${req.user.id} ${active ? 'activated' : 'deactivated'} user ${userId} at ${new Date()}`);

    res.json({ message: `User ${active ? 'activated' : 'deactivated'} successfully`, user });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Note: Lawyer verification functions are handled by verificationController.js
// Use verificationController.approveVerification(), verificationController.rejectVerification(), etc.

// Recent Activity Feed
exports.getRecentActivity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { limit = 50 } = req.query;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get recent user registrations
    const recentUsers = await User.find({
      createdAt: { $gte: oneDayAgo }
    }).select('name email role createdAt').limit(10);

    // Get recent cases
    const recentCases = await Case.find({
      createdAt: { $gte: oneDayAgo }
    }).populate('client', 'name email')
      .populate('lawyer', 'name email')
      .limit(10);

    // Get recent payments
    const recentPayments = await Payment.find({
      createdAt: { $gte: oneDayAgo }
    }).populate('client', 'name email').limit(10);

    // Get system notifications
    const recentNotifications = await Notification.find({
      type: { $in: ['system_alert', 'error', 'warning'] },
      createdAt: { $gte: oneDayAgo }
    }).limit(10);

    res.json({
      recentUsers,
      recentCases,
      recentPayments,
      recentNotifications
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verification Management
exports.getPendingVerifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { role, search, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter for unverified users
    let filter = {
      verificationStatus: 'pending'
    };
    
    // Filter by role if specified
    if (role && role !== 'all') {
      filter.role = role;
    } else {
      // Default to both clients and lawyers for verification
      filter.role = { $in: ['client', 'lawyer'] };
    }
    
    // Add search functionality
    if (search) {
      filter.$and = [
        filter,
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null }
          ].filter(Boolean)
        }
      ];
      // Combine search with verification status filter
      filter.$and = [
        { verificationStatus: 'pending' },
        filter.$and[1]
      ];
    }

    const pendingVerifications = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      verifications: pendingVerifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.approveVerification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const { notes } = req.body || {};

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        verificationStatus: 'verified',
        verificationDate: new Date(),
        verificationNotes: notes || 'Approved by admin'
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create notification for the lawyer
    await Notification.create({
      recipient: userId,
      type: 'verification',
      title: 'Verification Approved',
      message: 'Your lawyer verification has been approved. You can now offer services on the platform.',
      priority: 'high'
    });

    res.json({ message: 'Verification approved successfully', user });
  } catch (error) {
    console.error('Error approving verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.rejectVerification = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        verificationStatus: 'rejected',
        rejectionReason: reason || 'Verification requirements not met',
        rejectionDate: new Date()
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create notification for the lawyer
    await Notification.create({
      recipient: userId,
      type: 'verification',
      title: 'Verification Rejected',
      message: `Your lawyer verification has been rejected. Reason: ${reason || 'Requirements not met'}`,
      priority: 'high'
    });

    res.json({ message: 'Verification rejected successfully', user });
  } catch (error) {
    console.error('Error rejecting verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Platform Notifications Management
exports.createAnnouncement = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { title, message, targetRole, priority } = req.body;

    // Get target users based on role
    const query = targetRole === 'all' ? {} : { role: targetRole };
    const targetUsers = await User.find(query).select('_id');

    // Create notifications for all target users
    const notifications = targetUsers.map(user => ({
      user: user._id,
      type: 'admin_announcement',
      title,
      message,
      priority: priority || 'normal',
      data: { 
        createdBy: req.user._id,
        targetRole,
        isAnnouncement: true
      }
    }));

    await Notification.insertMany(notifications);

    res.json({ 
      message: 'Announcement created successfully',
      recipients: targetUsers.length
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSystemNotifications = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      type: { $in: ['admin_announcement', 'system_alert', 'error'] }
    })
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Notification.countDocuments({
      type: { $in: ['admin_announcement', 'system_alert', 'error'] }
    });

    res.json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching system notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== SERVICE MANAGEMENT =====

exports.getServices = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { page = 1, limit = 10, search, status, category } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    let filter = {};
    
    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { serviceType: { $regex: search, $options: 'i' } },
        { serviceCategory: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.isActive = status === 'active';
    }
    
    if (category && category !== 'all') {
      filter.serviceCategory = category;
    }

    const services = await LegalService.find(filter)
      .populate('lawyer', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await LegalService.countDocuments(filter);

    res.json({
      services,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateServiceStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { serviceId } = req.params;
    const { isActive } = req.body;

    const service = await LegalService.findByIdAndUpdate(
      serviceId,
      { isActive },
      { new: true }
    ).populate('lawyer', 'name email');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { serviceId } = req.params;

    const service = await LegalService.findByIdAndDelete(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get verification documents for a specific user
exports.getUserVerificationDocuments = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { userId } = req.params;
    const Document = require('../models/Document');

    // Get all verification documents for the user
    const verificationDocs = await Document.find({
      uploadedBy: userId,
      isVerificationDoc: true
    }).select('-fileData').sort({ createdAt: -1 });

    res.json(verificationDocs);
  } catch (error) {
    console.error('Error fetching user verification documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Download verification document
exports.downloadVerificationDocument = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { documentId } = req.params;
    const Document = require('../models/Document');

    // Get the document
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Only allow verification documents to be downloaded through this endpoint
    if (!document.isVerificationDoc) {
      return res.status(403).json({ message: 'This endpoint is only for verification documents' });
    }

    // Increment download count
    document.downloadCount += 1;
    document.lastAccessedAt = new Date();
    await document.save();

    // Set response headers
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Length', document.fileSize);

    // Send the file data
    res.send(document.fileData);
  } catch (error) {
    console.error('Error downloading verification document:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
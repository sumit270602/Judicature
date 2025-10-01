const Case = require('../models/Case');
const User = require('../models/User');

// Lawyer Dashboard Stats
const getLawyerStats = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Lawyer role required.' });
    }

    const lawyerId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get active cases count
    const activeCases = await Case.countDocuments({
      lawyer: lawyerId,
      status: 'active'
    });

    // Get today's hearings (mock for now - would need hearing schema)
    const todayHearings = await Case.countDocuments({
      lawyer: lawyerId,
      nextHearing: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    // Get pending tasks (cases with high priority or upcoming deadlines)
    const pendingTasks = await Case.countDocuments({
      lawyer: lawyerId,
      $or: [
        { priority: 'high', status: 'active' },
        { 
          nextHearing: {
            $gte: now,
            $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      ]
    });

    // Mock monthly revenue (would need billing/payment schema)
    const monthlyRevenue = 15000; // This would be calculated from actual billing records

    res.json({
      activeCases,
      todayHearings,
      pendingTasks,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Error fetching lawyer dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Client Dashboard Stats
const getClientStats = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Access denied. Client role required.' });
    }

    const clientId = req.user.id;
    const now = new Date();

    // Import required models
    const PaymentRequest = require('../models/PaymentRequest');
    const Payment = require('../models/Payment');
    const Notification = require('../models/Notification');

    // Get comprehensive case statistics
    const mongoose = require('mongoose');
    const [
      totalCases,
      activeCases,
      completedCases,
      pendingPaymentRequests,
      totalPayments,
      unreadNotifications,
      nextHearing
    ] = await Promise.all([
      Case.countDocuments({ client: new mongoose.Types.ObjectId(clientId) }),
      Case.countDocuments({ 
        client: new mongoose.Types.ObjectId(clientId), 
        status: { $in: ['pending', 'in_progress'] } 
      }),
      Case.countDocuments({ 
        client: new mongoose.Types.ObjectId(clientId), 
        status: { $in: ['resolved', 'completed'] } 
      }),
      PaymentRequest.countDocuments({ 
        client: new mongoose.Types.ObjectId(clientId), 
        status: 'pending' 
      }),
      Payment.aggregate([
        { $match: { client: new mongoose.Types.ObjectId(clientId), status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Notification.countDocuments({ 
        recipient: new mongoose.Types.ObjectId(clientId), 
        isRead: false 
      }),
      Case.findOne({ 
        client: new mongoose.Types.ObjectId(clientId), 
        'nextHearing.date': { $exists: true, $gte: now } 
      }).sort({ 'nextHearing.date': 1 })
    ]);

    const totalSpent = totalPayments.length > 0 ? totalPayments[0].total : 0;
    const nextCourtDate = nextHearing?.nextHearing?.date 
      ? new Date(nextHearing.nextHearing.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;

    const stats = {
      totalCases,
      activeCases,
      completedCases,
      pendingPayments: pendingPaymentRequests,
      nextCourtDate,
      totalSpent,
      unreadNotifications
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching client dashboard stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get client recent activity
const getClientRecentActivity = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Client role required.' 
      });
    }

    const clientId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Import required models
    const PaymentRequest = require('../models/PaymentRequest');
    const Notification = require('../models/Notification');
    const mongoose = require('mongoose');

    // Get recent case updates
    const recentCases = await Case.find({ client: new mongoose.Types.ObjectId(clientId) })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('lawyer', 'name')
      .select('title caseNumber status updatedAt');

    // Get recent payment requests
    const recentPaymentRequests = await PaymentRequest.find({ client: new mongoose.Types.ObjectId(clientId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('lawyer', 'name')
      .select('amount serviceType status createdAt lawyer');

    // Get recent notifications
    const recentNotifications = await Notification.find({ recipient: new mongoose.Types.ObjectId(clientId) })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type title message createdAt');

    // Combine and format activities
    const activities = [];

    // Add case activities
    recentCases.forEach(caseItem => {
      activities.push({
        _id: `case_${caseItem._id}`,
        type: 'case_update',
        title: `Case Update: ${caseItem.title}`,
        description: `Case ${caseItem.caseNumber} status changed to ${caseItem.status}`,
        timestamp: caseItem.updatedAt,
        caseId: caseItem._id
      });
    });

    // Add payment request activities
    recentPaymentRequests.forEach(request => {
      activities.push({
        _id: `payment_${request._id}`,
        type: 'payment_request',
        title: `Payment Request: ₹${request.amount.toLocaleString()}`,
        description: `${request.lawyer.name} requested payment for ${request.serviceType.replace('_', ' ')}`,
        timestamp: request.createdAt,
        paymentId: request._id
      });
    });

    // Add notification activities
    recentNotifications.forEach(notification => {
      if (notification.type === 'court') {
        activities.push({
          _id: `notification_${notification._id}`,
          type: 'court_date',
          title: notification.title,
          description: notification.message,
          timestamp: notification.createdAt
        });
      } else if (notification.type === 'message') {
        activities.push({
          _id: `notification_${notification._id}`,
          type: 'message',
          title: notification.title,
          description: notification.message,
          timestamp: notification.createdAt
        });
      }
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      activities: sortedActivities
    });

  } catch (error) {
    console.error('Error fetching client recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity'
    });
  }
};

// Timeline events for client dashboard
const getTimeline = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get recent cases for the user
    const caseQuery = userRole === 'lawyer' 
      ? { lawyer: userId }
      : { client: userId };

    const cases = await Case.find(caseQuery)
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate('client', 'name')
      .populate('lawyer', 'name');

    // Transform cases into timeline events
    const timelineEvents = cases.map(case_ => ({
      _id: case_._id,
      caseId: case_._id,
      title: `Case Update: ${case_.title}`,
      description: case_.description || 'Case information updated',
      type: 'update',
      createdAt: case_.updatedAt
    }));

    // Sort by most recent first
    timelineEvents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      events: timelineEvents
    });
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get case analytics for lawyers
const getLawyerAnalytics = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Lawyer role required.' });
    }

    const lawyerId = req.user.id;

    // Case distribution by type
    const caseDistribution = await Case.aggregate([
      { $match: { lawyer: lawyerId } },
      { $group: { _id: '$caseType', count: { $sum: 1 } } }
    ]);

    // Case status distribution
    const statusDistribution = await Case.aggregate([
      { $match: { lawyer: lawyerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Monthly case trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Case.aggregate([
      { 
        $match: { 
          lawyer: lawyerId,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      caseDistribution,
      statusDistribution,
      monthlyTrends,
      totalCases: await Case.countDocuments({ lawyer: lawyerId })
    });
  } catch (error) {
    console.error('Error fetching lawyer analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get notifications for user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, priority, unreadOnly } = req.query;
    
    let query = { recipient: userId };
    
    // Apply filters
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const Notification = require('../models/Notification');
    
    const notifications = await Notification.find(query)
      .populate('relatedCase', 'title caseNumber')
      .populate('relatedDocument', 'originalName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
};

module.exports = {
  getLawyerStats,
  getClientStats,
  getClientRecentActivity,
  getTimeline,
  getLawyerAnalytics,
  getNotifications
};
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

    // Get additional stats
    const totalCases = await Case.countDocuments({ lawyer: lawyerId });
    const resolvedCases = await Case.countDocuments({ 
      lawyer: lawyerId, 
      status: { $in: ['resolved', 'completed', 'closed'] } 
    });
    
    // Get total unique clients
    const totalClients = await Case.distinct('client', { lawyer: lawyerId }).then(clients => clients.length);
    
    // Mock additional fields (would be calculated from actual data)
    const monthlyRevenue = 15000;
    const completedOrders = resolvedCases; // Using resolved cases as proxy
    const successRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

    res.json({
      activeCases,
      todayHearings,
      pendingTasks,
      monthlyRevenue,
      totalCases,
      resolvedCases,
      totalClients,
      completedOrders,
      successRate
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

// Get Lawyer Recent Activity
const getLawyerRecentActivity = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Lawyer role required.' });
    }

    const lawyerId = req.user.id;
    const mongoose = require('mongoose');
    
    // Get recent cases and activities
    const recentCases = await Case.find({ 
      lawyer: new mongoose.Types.ObjectId(lawyerId) 
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .populate('client', 'name email')
    .lean();

    // Mock activity data based on recent cases
    const activities = recentCases.map((case_, index) => ({
      _id: `activity_${case_._id}`,
      type: index % 3 === 0 ? 'case_received' : (index % 3 === 1 ? 'case_resolved' : 'payment_received'),
      title: index % 3 === 0 ? `New Case: ${case_.title}` : (index % 3 === 1 ? `Case Resolved: ${case_.title}` : `Payment Received from ${case_.client.name}`),
      description: index % 3 === 0 ? `New case received from ${case_.client.name}` : (index % 3 === 1 ? `Successfully resolved case for ${case_.client.name}` : `Payment of ₹25,000 received`),
      createdAt: case_.updatedAt,
      caseId: case_._id,
      clientName: case_.client.name
    }));

    res.json({ activities });
  } catch (error) {
    console.error('Error fetching lawyer recent activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Lawyer Clients
const getLawyerClients = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Lawyer role required.' });
    }

    const lawyerId = req.user.id;
    const mongoose = require('mongoose');
    
    // Get unique clients for this lawyer
    const clientCases = await Case.aggregate([
      { 
        $match: { 
          lawyer: new mongoose.Types.ObjectId(lawyerId) 
        } 
      },
      {
        $group: {
          _id: '$client',
          casesCount: { $sum: 1 },
          activeCases: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          },
          lastContact: { $max: '$updatedAt' },
          caseTypes: { $addToSet: '$caseType' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      {
        $unwind: '$clientInfo'
      },
      {
        $project: {
          _id: '$clientInfo._id',
          name: '$clientInfo.name',
          email: '$clientInfo.email',
          phone: '$clientInfo.phone',
          casesCount: 1,
          activeCases: 1,
          lastContact: 1,
          caseTypes: 1
        }
      },
      {
        $sort: { lastContact: -1 }
      },
      {
        $limit: 20
      }
    ]);

    res.json({ clients: clientCases });
  } catch (error) {
    console.error('Error fetching lawyer clients:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Lawyer Documents
const getLawyerDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Lawyer role required.' });
    }

    const lawyerId = req.user.id;
    const mongoose = require('mongoose');
    const Document = require('../models/Document');
    
    // Get documents grouped by case
    const documentsGrouped = await Case.aggregate([
      { 
        $match: { 
          lawyer: new mongoose.Types.ObjectId(lawyerId) 
        } 
      },
      {
        $lookup: {
          from: 'documents',
          localField: '_id',
          foreignField: 'caseId',
          as: 'documents'
        }
      },
      {
        $match: {
          'documents.0': { $exists: true }
        }
      },
      {
        $project: {
          caseId: '$_id',
          caseTitle: '$title',
          caseStatus: '$status',
          documents: {
            $map: {
              input: '$documents',
              as: 'doc',
              in: {
                _id: '$$doc._id',
                originalName: '$$doc.originalName',
                mimeType: '$$doc.mimeType',
                fileSize: '$$doc.fileSize',
                uploadedAt: '$$doc.uploadedAt',
                uploaderName: '$$doc.uploaderName'
              }
            }
          }
        }
      },
      {
        $sort: { 'documents.uploadedAt': -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({ documentsByCase: documentsGrouped });
  } catch (error) {
    console.error('Error fetching lawyer documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get detailed client information for lawyers
const getClientDetails = async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ message: 'Access denied. Lawyer role required.' });
    }

    const lawyerId = req.user.id;
    const { clientId } = req.params;

    // First verify that this client has cases with this lawyer
    const clientCases = await Case.find({ 
      client: clientId, 
      lawyer: lawyerId 
    });

    if (clientCases.length === 0) {
      return res.status(404).json({ 
        message: 'Client not found or no cases associated with this lawyer' 
      });
    }

    // Get client details
    const client = await User.findById(clientId).select('-password -stripeAccountId');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get comprehensive case information
    const cases = await Case.find({ 
      client: clientId, 
      lawyer: lawyerId 
    }).sort({ createdAt: -1 });

    // Import Payment model
    const Payment = require('../models/Payment');
    const PaymentRequest = require('../models/PaymentRequest');

    // Get payment information
    const payments = await Payment.find({ 
      clientId: clientId,
      lawyerId: lawyerId 
    }).sort({ createdAt: -1 });

    const paymentRequests = await PaymentRequest.find({ 
      clientId: clientId,
      lawyerId: lawyerId 
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status === 'active').length;
    const completedCases = cases.filter(c => ['resolved', 'completed', 'closed'].includes(c.status)).length;
    
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const pendingPayments = paymentRequests
      .filter(pr => pr.status === 'pending')
      .reduce((sum, request) => sum + request.amount, 0);

    // Get last contact date from most recent case update or message
    const lastContact = cases.length > 0 
      ? new Date(Math.max(...cases.map(c => new Date(c.updatedAt))))
      : new Date(client.createdAt);

    // Build comprehensive client response
    const clientDetails = {
      _id: client._id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      dateOfBirth: client.dateOfBirth,
      occupation: client.occupation,
      company: client.company,
      registrationDate: client.createdAt,
      lastContact: lastContact,
      totalCases,
      activeCases,
      completedCases,
      totalPaid,
      pendingPayments,
      preferredCommunication: client.preferredCommunication || 'Email',
      notes: client.bio,
      status: client.isActive ? 'active' : 'inactive',
      avatar: client.profilePicture,
      cases: cases.map(c => ({
        _id: c._id,
        caseNumber: c.caseNumber,
        title: c.title,
        category: c.category,
        status: c.status,
        priority: c.priority,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        nextHearing: c.nextHearing,
        totalAmount: c.totalAmount || 0,
        paidAmount: c.paidAmount || 0,
        description: c.description
      })),
      payments: payments.map(p => ({
        _id: p._id,
        amount: p.amount,
        status: p.status,
        date: p.createdAt,
        method: p.method || 'Card',
        caseId: p.caseId,
        caseTitle: cases.find(c => c._id.toString() === p.caseId?.toString())?.title || 'N/A',
        description: p.description
      })),
      paymentRequests: paymentRequests.map(pr => ({
        _id: pr._id,
        amount: pr.amount,
        status: pr.status,
        dueDate: pr.dueDate,
        description: pr.description,
        caseId: pr.caseId,
        createdAt: pr.createdAt
      }))
    };

    res.json(clientDetails);
  } catch (error) {
    console.error('Error fetching client details:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getLawyerStats,
  getClientStats,
  getClientRecentActivity,
  getTimeline,
  getLawyerAnalytics,
  getNotifications,
  getLawyerRecentActivity,
  getLawyerClients,
  getLawyerDocuments,
  getClientDetails
};
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkVerificationStatus } = require('../middleware/verification');
const Case = require('../models/Case');
const User = require('../models/User');

// Apply authentication and verification to all dashboard routes
router.use(auth, checkVerificationStatus);

// Lawyer Dashboard Stats
router.get('/lawyer/stats', async (req, res) => {
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
});

// Client Dashboard Stats
router.get('/client/stats', async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Access denied. Client role required.' });
    }

    const clientId = req.user.id;
    const now = new Date();

    // Get active cases count
    const activeCases = await Case.countDocuments({
      client: clientId,
      status: { $in: ['active', 'pending'] }
    });

    // Get next court date
    const nextCase = await Case.findOne({
      client: clientId,
      nextHearing: { $gte: now }
    })
    .sort({ nextHearing: 1 })
    .select('nextHearing');

    const nextCourtDate = nextCase?.nextHearing 
      ? new Date(nextCase.nextHearing).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'None scheduled';

    // Get pending actions (high priority cases or upcoming deadlines)
    const pendingActions = await Case.countDocuments({
      client: clientId,
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

    res.json({
      activeCases,
      nextCourtDate,
      pendingActions
    });
  } catch (error) {
    console.error('Error fetching client dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Timeline events for client dashboard
router.get('/timeline', async (req, res) => {
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
});

// Get case analytics for lawyers
router.get('/lawyer/analytics', async (req, res) => {
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
});

// Get notifications for user
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // This would typically come from a Notifications collection
    // For now, we'll generate notifications based on cases
    const caseQuery = userRole === 'lawyer' 
      ? { lawyer: userId }
      : { client: userId };

    const urgentCases = await Case.find({
      ...caseQuery,
      priority: 'high',
      status: 'active'
    }).limit(5);

    const upcomingHearings = await Case.find({
      ...caseQuery,
      nextHearing: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
      }
    }).limit(5);

    const notifications = [
      ...urgentCases.map(case_ => ({
        _id: `urgent-${case_._id}`,
        title: 'High Priority Case',
        message: `Case "${case_.title}" requires immediate attention`,
        type: 'urgent',
        caseId: case_._id,
        createdAt: case_.updatedAt,
        unread: true
      })),
      ...upcomingHearings.map(case_ => ({
        _id: `hearing-${case_._id}`,
        title: 'Upcoming Hearing',
        message: `Hearing scheduled for ${new Date(case_.nextHearing).toLocaleDateString()}`,
        type: 'reminder',
        caseId: case_._id,
        createdAt: case_.nextHearing,
        unread: true
      }))
    ];

    // Sort by most recent first
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      notifications: notifications.slice(0, 10) // Limit to 10 most recent
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
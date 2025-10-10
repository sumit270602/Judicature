
const TimeTracking = require('../models/TimeTracking');
const Invoice = require('../models/Invoice');
const Case = require('../models/Case');
const User = require('../models/User');

// Start Time Tracking
const startTimer = async (req, res) => {
  try {
    const { caseId, description, activityType, hourlyRate } = req.body;
    const lawyerId = req.user.id;

    // Validate case access
    const caseDetails = await Case.findById(caseId);
    if (!caseDetails) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseDetails.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access to case' });
    }

    // Check if there's already an active timer for this lawyer
    const activeTimer = await TimeTracking.findOne({
      lawyer: lawyerId,
      'timer.isActive': true
    });

    if (activeTimer) {
      return res.status(400).json({ 
        message: 'You already have an active timer running',
        activeTimer: {
          id: activeTimer._id,
          case: activeTimer.case,
          description: activeTimer.description,
          startTime: activeTimer.startTime
        }
      });
    }

    // Create new time tracking entry
    const timeEntry = new TimeTracking({
      case: caseId,
      lawyer: lawyerId,
      client: caseDetails.client,
      description,
      activityType,
      billing: {
        hourlyRate: hourlyRate || 1000 // Default rate
      },
      timer: {
        isActive: true
      }
    });

    await timeEntry.startTimer();

    res.status(201).json({
      success: true,
      message: 'Timer started successfully',
      timeEntry: {
        id: timeEntry._id,
        startTime: timeEntry.startTime,
        description: timeEntry.description,
        activityType: timeEntry.activityType
      }
    });

  } catch (error) {
    console.error('Start timer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to start timer',
      error: error.message 
    });
  }
};

// Stop Time Tracking
const stopTimer = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const lawyerId = req.user.id;

    const timeEntry = await TimeTracking.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (!timeEntry.timer.isActive) {
      return res.status(400).json({ message: 'Timer is not active' });
    }

    await timeEntry.stopTimer();

    res.json({
      success: true,
      message: 'Timer stopped successfully',
      timeEntry: {
        id: timeEntry._id,
        duration: timeEntry.duration,
        amount: timeEntry.billing.amount,
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime
      }
    });

  } catch (error) {
    console.error('Stop timer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to stop timer',
      error: error.message 
    });
  }
};

// Pause Timer
const pauseTimer = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const { reason } = req.body;
    const lawyerId = req.user.id;

    const timeEntry = await TimeTracking.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await timeEntry.pauseTimer(reason);

    res.json({
      success: true,
      message: 'Timer paused successfully'
    });

  } catch (error) {
    console.error('Pause timer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to pause timer',
      error: error.message 
    });
  }
};

// Resume Timer
const resumeTimer = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const lawyerId = req.user.id;

    const timeEntry = await TimeTracking.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    await timeEntry.resumeTimer();

    res.json({
      success: true,
      message: 'Timer resumed successfully'
    });

  } catch (error) {
    console.error('Resume timer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resume timer',
      error: error.message 
    });
  }
};

// Add Manual Time Entry
const addManualTimeEntry = async (req, res) => {
  try {
    const {
      caseId,
      date,
      duration,
      description,
      activityType,
      hourlyRate,
      billable = true,
      tags,
      location
    } = req.body;
    const lawyerId = req.user.id;

    // Validate case access
    const caseDetails = await Case.findById(caseId);
    if (!caseDetails) {
      return res.status(404).json({ message: 'Case not found' });
    }

    if (caseDetails.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access to case' });
    }

    // Create manual time entry
    const timeEntry = new TimeTracking({
      case: caseId,
      lawyer: lawyerId,
      client: caseDetails.client,
      date: date || new Date(),
      startTime: new Date(date || Date.now()),
      duration,
      description,
      activityType,
      billing: {
        billable,
        hourlyRate: hourlyRate || 1000
      },
      tags: tags || [],
      location,
      status: 'draft'
    });

    await timeEntry.save();

    res.status(201).json({
      success: true,
      message: 'Manual time entry added successfully',
      timeEntry: {
        id: timeEntry._id,
        duration: timeEntry.duration,
        amount: timeEntry.billing.amount,
        description: timeEntry.description
      }
    });

  } catch (error) {
    console.error('Add manual time entry error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add manual time entry',
      error: error.message 
    });
  }
};

// Get Time Entries
const getTimeEntries = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { 
      caseId, 
      status, 
      billable,
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = req.query;

    const query = { lawyer: lawyerId };
    
    if (caseId) query.case = caseId;
    if (status) query.status = status;
    if (billable !== undefined) query['billing.billable'] = billable === 'true';
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const timeEntries = await TimeTracking.find(query)
      .populate('case', 'title caseNumber')
      .populate('client', 'name email')
      .populate('invoice', 'invoiceNumber status')
      .sort({ date: -1, startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TimeTracking.countDocuments(query);

    // Get summary statistics
    const stats = await TimeTracking.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalHours: { $sum: { $divide: ['$duration', 60] } },
          totalAmount: { $sum: '$billing.amount' },
          billableHours: {
            $sum: {
              $cond: [
                { $eq: ['$billing.billable', true] },
                { $divide: ['$duration', 60] },
                0
              ]
            }
          },
          billableAmount: {
            $sum: {
              $cond: [
                { $eq: ['$billing.billable', true] },
                '$billing.amount',
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      timeEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEntries: total
      },
      stats: stats[0] || {
        totalHours: 0,
        totalAmount: 0,
        billableHours: 0,
        billableAmount: 0
      }
    });

  } catch (error) {
    console.error('Get time entries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get time entries',
      error: error.message 
    });
  }
};

// Update Time Entry
const updateTimeEntry = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const updates = req.body;
    const lawyerId = req.user.id;

    const timeEntry = await TimeTracking.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (timeEntry.billing.invoiced) {
      return res.status(400).json({ message: 'Cannot update invoiced time entry' });
    }

    // Store modification history
    timeEntry.modificationHistory.push({
      modifiedBy: lawyerId,
      changes: JSON.stringify(updates),
      previousValues: {
        duration: timeEntry.duration,
        description: timeEntry.description,
        billing: timeEntry.billing
      }
    });

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'lawyer' && key !== 'case') {
        if (key.includes('.')) {
          // Handle nested updates like billing.hourlyRate
          const [parent, child] = key.split('.');
          if (timeEntry[parent] && typeof timeEntry[parent] === 'object') {
            timeEntry[parent][child] = updates[key];
          }
        } else {
          timeEntry[key] = updates[key];
        }
      }
    });

    await timeEntry.save();

    res.json({
      success: true,
      message: 'Time entry updated successfully',
      timeEntry
    });

  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update time entry',
      error: error.message 
    });
  }
};

// Delete Time Entry
const deleteTimeEntry = async (req, res) => {
  try {
    const { timeEntryId } = req.params;
    const lawyerId = req.user.id;

    const timeEntry = await TimeTracking.findById(timeEntryId);
    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.lawyer.toString() !== lawyerId) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (timeEntry.billing.invoiced) {
      return res.status(400).json({ message: 'Cannot delete invoiced time entry' });
    }

    await TimeTracking.findByIdAndDelete(timeEntryId);

    res.json({
      success: true,
      message: 'Time entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete time entry',
      error: error.message 
    });
  }
};

// Submit Time Entries for Approval
const submitTimeEntries = async (req, res) => {
  try {
    const { timeEntryIds } = req.body;
    const lawyerId = req.user.id;

    // Validate all time entries belong to the lawyer
    const timeEntries = await TimeTracking.find({
      _id: { $in: timeEntryIds },
      lawyer: lawyerId,
      status: 'draft'
    });

    if (timeEntries.length !== timeEntryIds.length) {
      return res.status(400).json({ message: 'Some time entries are invalid or already submitted' });
    }

    // Update all entries to submitted status
    await TimeTracking.updateMany(
      { _id: { $in: timeEntryIds } },
      { status: 'submitted' }
    );

    res.json({
      success: true,
      message: `${timeEntries.length} time entries submitted for approval`
    });

  } catch (error) {
    console.error('Submit time entries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit time entries',
      error: error.message 
    });
  }
};

// Get Uninvoiced Time Entries
const getUninvoicedEntries = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { caseId } = req.query;

    const entries = await TimeTracking.getUninvoicedEntries(lawyerId, caseId);

    // Group by case
    const groupedEntries = entries.reduce((acc, entry) => {
      const caseKey = entry.case._id.toString();
      if (!acc[caseKey]) {
        acc[caseKey] = {
          case: entry.case,
          client: entry.client,
          entries: [],
          totalHours: 0,
          totalAmount: 0
        };
      }
      acc[caseKey].entries.push(entry);
      acc[caseKey].totalHours += entry.duration / 60;
      acc[caseKey].totalAmount += entry.billing.amount;
      return acc;
    }, {});

    res.json({
      success: true,
      uninvoicedEntries: Object.values(groupedEntries)
    });

  } catch (error) {
    console.error('Get uninvoiced entries error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get uninvoiced entries',
      error: error.message 
    });
  }
};

// Get Active Timer
const getActiveTimer = async (req, res) => {
  try {
    const lawyerId = req.user.id;

    const activeTimer = await TimeTracking.findOne({
      lawyer: lawyerId,
      'timer.isActive': true
    })
    .populate('case', 'title caseNumber')
    .populate('client', 'name');

    res.json({
      success: true,
      activeTimer
    });

  } catch (error) {
    console.error('Get active timer error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get active timer',
      error: error.message 
    });
  }
};

// Get Daily Summary
const getDailySummary = async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const summary = await TimeTracking.getDailySummary(lawyerId, new Date(date));

    res.json({
      success: true,
      date,
      summary
    });

  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get daily summary',
      error: error.message 
    });
  }
};

module.exports = {
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
  addManualTimeEntry,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
  submitTimeEntries,
  getUninvoicedEntries,
  getActiveTimer,
  getDailySummary
};
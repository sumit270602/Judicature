const WorkItem = require('../models/WorkItem');
const Case = require('../models/Case');
const User = require('../models/User');
const Payment = require('../models/Payment');
const TransactionAudit = require('../models/TransactionAudit');
const { validationResult } = require('express-validator');

// Create Work Item
const createWorkItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }
    
    const {
      caseId,
      title,
      description,
      workType,
      estimatedHours,
      billingRate,
      deliverables,
      priority,
      dueDate
    } = req.body;
    
    // Verify case exists and lawyer is assigned
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }
    
    if (caseData.assignedLawyer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this case'
      });
    }
    
    // Calculate estimated amount
    const estimatedAmount = (estimatedHours || 0) * (billingRate || 0);
    
    const workItem = new WorkItem({
      case: caseId,
      client: caseData.client,
      lawyer: req.user.id,
      title,
      description,
      workType,
      estimatedHours,
      billingRate,
      estimatedAmount,
      deliverables: deliverables || [],
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: 'pending',
      workflow: {
        created: {
          date: new Date(),
          by: req.user.id,
          notes: 'Work item created by lawyer'
        }
      }
    });
    
    await workItem.save();
    await workItem.populate([
      { path: 'case', select: 'title caseNumber' },
      { path: 'client', select: 'name email' },
      { path: 'lawyer', select: 'name email' }
    ]);
    
    // Create audit log
    await TransactionAudit.create({
      transactionId: `WORK_CREATE_${Date.now()}`,
      payment: null,
      transactionType: 'work_item_creation',
      amounts: {
        original: 0,
        processed: estimatedAmount
      },
      initiatedBy: {
        user: req.user.id,
        role: 'lawyer',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      gateway: {
        provider: 'manual'
      },
      status: 'completed',
      metadata: {
        workItemId: workItem._id,
        caseId,
        workType,
        estimatedHours
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Work item created successfully',
      data: workItem
    });
    
  } catch (error) {
    console.error('Create work item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create work item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Work Items
const getWorkItems = async (req, res) => {
  try {
    const {
      caseId,
      status,
      workType,
      priority,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build query based on user role
    let query = {};
    
    if (req.user.role === 'lawyer') {
      query.lawyer = req.user.id;
    } else if (req.user.role === 'client') {
      query.client = req.user.id;
    } else if (req.user.role === 'admin') {
      // Admin can see all work items
    }
    
    if (caseId) query.case = caseId;
    if (status) query.status = status;
    if (workType) query.workType = workType;
    if (priority) query.priority = priority;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      populate: [
        { path: 'case', select: 'title caseNumber status' },
        { path: 'client', select: 'name email profilePicture' },
        { path: 'lawyer', select: 'name email profilePicture practiceAreas' }
      ]
    };
    
    const workItems = await WorkItem.paginate(query, options);
    
    // Calculate summary statistics
    const summaryQuery = { ...query };
    delete summaryQuery.case; // Remove case filter for summary
    
    const summary = await WorkItem.aggregate([
      { $match: summaryQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$estimatedAmount' },
          actualAmount: { $sum: '$actualAmount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: workItems.docs,
      pagination: {
        currentPage: workItems.page,
        totalPages: workItems.totalPages,
        totalItems: workItems.totalDocs,
        itemsPerPage: workItems.limit,
        hasNextPage: workItems.hasNextPage,
        hasPrevPage: workItems.hasPrevPage
      },
      summary: summary.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalAmount: item.totalAmount,
          actualAmount: item.actualAmount
        };
        return acc;
      }, {})
    });
    
  } catch (error) {
    console.error('Get work items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch work items',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update Work Item Status
const updateWorkItemStatus = async (req, res) => {
  try {
    const { workItemId } = req.params;
    const { status, notes, actualHours, actualAmount, deliverables } = req.body;
    
    const workItem = await WorkItem.findById(workItemId);
    if (!workItem) {
      return res.status(404).json({
        success: false,
        message: 'Work item not found'
      });
    }
    
    // Check permissions
    const canUpdate = (
      (req.user.role === 'lawyer' && workItem.lawyer.toString() === req.user.id) ||
      (req.user.role === 'client' && workItem.client.toString() === req.user.id && ['in_review', 'completed'].includes(status)) ||
      req.user.role === 'admin'
    );
    
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this work item'
      });
    }
    
    // Validate status transition
    const validTransitions = {
      'pending': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'in_review', 'on_hold', 'cancelled'],
      'in_review': ['approved', 'revision_required', 'cancelled'],
      'revision_required': ['in_progress', 'cancelled'],
      'on_hold': ['in_progress', 'cancelled'],
      'approved': ['paid'],
      'completed': ['in_review'],
      'cancelled': [],
      'paid': []
    };
    
    if (!validTransitions[workItem.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${workItem.status} to ${status}`
      });
    }
    
    // Update work item
    const oldStatus = workItem.status;
    workItem.status = status;
    
    if (actualHours !== undefined) workItem.actualHours = actualHours;
    if (actualAmount !== undefined) workItem.actualAmount = actualAmount;
    if (deliverables) workItem.deliverables = [...workItem.deliverables, ...deliverables];
    
    // Update workflow
    workItem.workflow[status] = {
      date: new Date(),
      by: req.user.id,
      notes: notes || ''
    };
    
    // Handle auto-approval
    if (status === 'completed' && workItem.autoApproval.enabled) {
      workItem.autoApproval.eligibleDate = new Date(Date.now() + (workItem.autoApproval.daysToAutoApprove * 24 * 60 * 60 * 1000));
    }
    
    await workItem.save();
    
    // Create payment if approved
    if (status === 'approved' && workItem.actualAmount > 0) {
      const payment = new Payment({
        client: workItem.client,
        lawyer: workItem.lawyer,
        case: workItem.case,
        workItem: workItem._id,
        amount: workItem.actualAmount,
        type: 'work_completion',
        status: 'pending',
        dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
        description: `Payment for work item: ${workItem.title}`,
        breakdown: {
          baseAmount: workItem.actualAmount,
          platformFee: workItem.actualAmount * 0.02, // 2% platform fee
          gstAmount: workItem.actualAmount * 0.18, // 18% GST
          totalAmount: workItem.actualAmount * 1.20 // Including fees and GST
        }
      });
      
      await payment.save();
      workItem.payment = payment._id;
      await workItem.save();
    }
    
    // Create audit log
    await TransactionAudit.create({
      transactionId: `WORK_STATUS_${Date.now()}`,
      payment: workItem.payment,
      transactionType: 'work_status_update',
      amounts: {
        original: workItem.estimatedAmount,
        processed: workItem.actualAmount || workItem.estimatedAmount
      },
      initiatedBy: {
        user: req.user.id,
        role: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      },
      gateway: {
        provider: 'manual'
      },
      status: 'completed',
      metadata: {
        workItemId: workItem._id,
        oldStatus,
        newStatus: status,
        actualHours,
        notes
      }
    });
    
    await workItem.populate([
      { path: 'case', select: 'title caseNumber' },
      { path: 'client', select: 'name email' },
      { path: 'lawyer', select: 'name email' },
      { path: 'payment', select: 'amount status dueDate' }
    ]);
    
    res.json({
      success: true,
      message: `Work item status updated to ${status}`,
      data: workItem
    });
    
  } catch (error) {
    console.error('Update work item status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update work item status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Add Work Item Communication
const addWorkItemCommunication = async (req, res) => {
  try {
    const { workItemId } = req.params;
    const { message, attachments, messageType = 'general' } = req.body;
    
    const workItem = await WorkItem.findById(workItemId);
    if (!workItem) {
      return res.status(404).json({
        success: false,
        message: 'Work item not found'
      });
    }
    
    // Check if user is involved in this work item
    const isInvolved = (
      workItem.lawyer.toString() === req.user.id ||
      workItem.client.toString() === req.user.id ||
      req.user.role === 'admin'
    );
    
    if (!isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to add communication to this work item'
      });
    }
    
    const communication = {
      sender: req.user.id,
      senderRole: req.user.role,
      message,
      messageType,
      attachments: attachments || [],
      timestamp: new Date(),
      isRead: false
    };
    
    workItem.communications.push(communication);
    await workItem.save();
    
    await workItem.populate([
      { path: 'communications.sender', select: 'name email profilePicture' }
    ]);
    
    res.json({
      success: true,
      message: 'Communication added successfully',
      data: workItem.communications[workItem.communications.length - 1]
    });
    
  } catch (error) {
    console.error('Add work item communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add communication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Process Auto-Approvals
const processAutoApprovals = async (req, res) => {
  try {
    // Find work items eligible for auto-approval
    const eligibleWorkItems = await WorkItem.find({
      status: 'completed',
      'autoApproval.enabled': true,
      'autoApproval.eligibleDate': { $lte: new Date() }
    });
    
    let processedCount = 0;
    const results = [];
    
    for (const workItem of eligibleWorkItems) {
      try {
        // Auto-approve the work item
        workItem.status = 'approved';
        workItem.workflow.approved = {
          date: new Date(),
          by: 'system',
          notes: 'Auto-approved after specified waiting period'
        };
        
        // Create payment
        const payment = new Payment({
          client: workItem.client,
          lawyer: workItem.lawyer,
          case: workItem.case,
          workItem: workItem._id,
          amount: workItem.actualAmount,
          type: 'work_completion',
          status: 'pending',
          dueDate: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
          description: `Auto-approved payment for work item: ${workItem.title}`,
          breakdown: {
            baseAmount: workItem.actualAmount,
            platformFee: workItem.actualAmount * 0.02,
            gstAmount: workItem.actualAmount * 0.18,
            totalAmount: workItem.actualAmount * 1.20
          }
        });
        
        await payment.save();
        workItem.payment = payment._id;
        await workItem.save();
        
        // Create audit log
        await TransactionAudit.create({
          transactionId: `AUTO_APPROVE_${Date.now()}_${workItem._id}`,
          payment: payment._id,
          transactionType: 'auto_approval',
          amounts: {
            original: workItem.estimatedAmount,
            processed: workItem.actualAmount
          },
          initiatedBy: {
            user: 'system',
            role: 'system',
            ipAddress: req.ip,
            userAgent: 'Auto-Approval System'
          },
          gateway: {
            provider: 'system'
          },
          status: 'completed',
          metadata: {
            workItemId: workItem._id,
            autoApprovalDate: new Date(),
            waitingPeriod: workItem.autoApproval.daysToAutoApprove
          }
        });
        
        processedCount++;
        results.push({
          workItemId: workItem._id,
          title: workItem.title,
          amount: workItem.actualAmount,
          status: 'success'
        });
        
      } catch (itemError) {
        console.error(`Error auto-approving work item ${workItem._id}:`, itemError);
        results.push({
          workItemId: workItem._id,
          title: workItem.title,
          status: 'error',
          error: itemError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Processed ${processedCount} auto-approvals`,
      data: {
        processedCount,
        totalEligible: eligibleWorkItems.length,
        results
      }
    });
    
  } catch (error) {
    console.error('Process auto-approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process auto-approvals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Work Item Analytics
const getWorkItemAnalytics = async (req, res) => {
  try {
    const { period = '30d', caseId } = req.query;
    
    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = periodDays[period] || 30;
    const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
    
    // Build query based on user role
    let matchQuery = {
      createdAt: { $gte: startDate }
    };
    
    if (req.user.role === 'lawyer') {
      matchQuery.lawyer = req.user.id;
    } else if (req.user.role === 'client') {
      matchQuery.client = req.user.id;
    }
    
    if (caseId) {
      matchQuery.case = caseId;
    }
    
    // Aggregate analytics
    const analytics = await WorkItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalWorkItems: { $sum: 1 },
          totalEstimatedAmount: { $sum: '$estimatedAmount' },
          totalActualAmount: { $sum: '$actualAmount' },
          totalHoursEstimated: { $sum: '$estimatedHours' },
          totalHoursActual: { $sum: '$actualHours' },
          statusBreakdown: {
            $push: '$status'
          },
          workTypeBreakdown: {
            $push: '$workType'
          },
          avgCompletionTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                {
                  $divide: [
                    { $subtract: ['$workflow.completed.date', '$createdAt'] },
                    1000 * 60 * 60 * 24
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);
    
    // Status distribution
    const statusDistribution = await WorkItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$actualAmount' }
        }
      }
    ]);
    
    // Work type distribution
    const workTypeDistribution = await WorkItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$workType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$actualAmount' },
          avgAmount: { $avg: '$actualAmount' }
        }
      }
    ]);
    
    // Daily trend
    const dailyTrend = await WorkItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          amount: { $sum: '$actualAmount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);
    
    const result = analytics[0] || {
      totalWorkItems: 0,
      totalEstimatedAmount: 0,
      totalActualAmount: 0,
      totalHoursEstimated: 0,
      totalHoursActual: 0,
      avgCompletionTime: 0
    };
    
    res.json({
      success: true,
      data: {
        summary: result,
        statusDistribution,
        workTypeDistribution,
        dailyTrend,
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Get work item analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createWorkItem,
  getWorkItems,
  updateWorkItemStatus,
  addWorkItemCommunication,
  processAutoApprovals,
  getWorkItemAnalytics
};
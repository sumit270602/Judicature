
const mongoose = require('mongoose');

// Work Item Schema for tracking lawyer work and client approval workflow
const workItemSchema = new mongoose.Schema({
  // Identification and References
  workItemId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'WI' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
  },
  
  // Case and Parties
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true,
    index: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Work Classification
  workType: {
    type: String,
    enum: [
      'consultation',
      'research',
      'document_drafting',
      'court_appearance',
      'client_meeting',
      'case_preparation',
      'filing',
      'negotiation',
      'correspondence',
      'other'
    ],
    required: true,
    index: true
  },
  
  // Work Details
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 2000,
    trim: true
  },
  
  // Work Summary (Submitted by Lawyer)
  workSummary: {
    actualWorkDone: {
      type: String,
      maxlength: 2000
    },
    keyAchievements: [{
      type: String,
      maxlength: 500
    }],
    challenges: {
      type: String,
      maxlength: 1000
    },
    nextSteps: {
      type: String,
      maxlength: 1000
    },
    documentsCreated: [{
      name: String,
      description: String,
      fileUrl: String,
      fileSize: Number,
      mimeType: String
    }]
  },
  
  // Time and Billing Information
  billing: {
    type: {
      type: String,
      enum: ['hourly', 'fixed', 'milestone'],
      required: true
    },
    // For hourly billing
    billableHours: {
      type: Number,
      min: 0,
      validate: {
        validator: function(v) {
          return this.billing.type !== 'hourly' || v > 0;
        },
        message: 'Billable hours required for hourly billing'
      }
    },
    hourlyRate: {
      type: Number,
      min: 0
    },
    // For fixed billing
    fixedFee: {
      type: Number,
      min: 0,
      validate: {
        validator: function(v) {
          return this.billing.type !== 'fixed' || v > 0;
        },
        message: 'Fixed fee required for fixed billing'
      }
    },
    // Calculated amounts
    baseAmount: {
      type: Number,
      required: true,
      min: 0
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    }
  },
  
  // Time Tracking
  timeTracking: {
    startTime: Date,
    endTime: Date,
    totalMinutes: {
      type: Number,
      min: 0,
      default: 0
    },
    breakTime: {
      type: Number,
      min: 0,
      default: 0
    },
    timeEntries: [{
      date: {
        type: Date,
        default: Date.now
      },
      description: String,
      minutes: {
        type: Number,
        min: 0
      },
      isChargeable: {
        type: Boolean,
        default: true
      }
    }]
  },
  
  // Work Status and Workflow
  status: {
    type: String,
    enum: [
      'assigned',        // Work assigned to lawyer
      'in_progress',     // Lawyer working on it
      'submitted',       // Lawyer submitted work for review
      'client_reviewing', // Client is reviewing the work
      'revision_requested', // Client requested changes
      'approved',        // Client approved the work
      'payment_pending', // Approved but payment not processed
      'completed',       // Work completed and paid
      'disputed',        // Work disputed by client
      'cancelled'        // Work item cancelled
    ],
    default: 'assigned',
    index: true
  },
  
  // Important Dates
  dates: {
    assignedAt: {
      type: Date,
      default: Date.now
    },
    startedAt: Date,
    submittedAt: {
      type: Date,
      index: true
    },
    reviewDeadline: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v > Date.now();
        },
        message: 'Review deadline must be in the future'
      }
    },
    approvedAt: Date,
    completedAt: Date,
    paidAt: Date
  },
  
  // Client Review and Feedback
  clientReview: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      maxlength: 1000
    },
    isRevisionRequested: {
      type: Boolean,
      default: false
    },
    revisionComments: {
      type: String,
      maxlength: 1000
    },
    reviewedAt: Date
  },
  
  // Dispute Management
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false,
      index: true
    },
    disputeReason: {
      type: String,
      enum: [
        'quality_issues',
        'incomplete_work',
        'delayed_delivery',
        'billing_discrepancy',
        'communication_issues',
        'other'
      ]
    },
    disputeDescription: {
      type: String,
      maxlength: 1000
    },
    disputeRaisedAt: Date,
    disputeResolvedAt: Date,
    resolution: {
      type: String,
      maxlength: 1000
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Admin who resolved
    }
  },
  
  // File Attachments
  attachments: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  }],
  
  // Communication Log
  communications: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000
    },
    messageType: {
      type: String,
      enum: ['info', 'query', 'update', 'approval', 'revision'],
      default: 'info'
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    readAt: Date,
    attachments: [{
      name: String,
      fileUrl: String
    }]
  }],
  
  // Auto-approval Settings
  autoApproval: {
    isEnabled: {
      type: Boolean,
      default: true
    },
    days: {
      type: Number,
      min: 1,
      max: 30,
      default: 3 // 3 days default for auto-approval
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: Date
  },
  
  // Compliance and Audit
  audit: {
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    statusHistory: [{
      status: String,
      changedAt: {
        type: Date,
        default: Date.now
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String
    }],
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
workItemSchema.index({ case: 1, status: 1 });
workItemSchema.index({ lawyer: 1, status: 1 });
workItemSchema.index({ client: 1, status: 1 });
workItemSchema.index({ 'dates.submittedAt': -1 });
workItemSchema.index({ 'dates.reviewDeadline': 1 });
workItemSchema.index({ 'autoApproval.isEnabled': 1, 'dates.submittedAt': 1 });
workItemSchema.index({ createdAt: -1 });

// Virtual for work duration in hours
workItemSchema.virtual('workDurationHours').get(function() {
  if (this.timeTracking.startTime && this.timeTracking.endTime) {
    const diffMs = this.timeTracking.endTime - this.timeTracking.startTime;
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }
  return this.timeTracking.totalMinutes ? this.timeTracking.totalMinutes / 60 : 0;
});

// Virtual for days since submission
workItemSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.dates.submittedAt) return null;
  const diffMs = Date.now() - this.dates.submittedAt;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// Virtual for review deadline status
workItemSchema.virtual('isOverdue').get(function() {
  return this.dates.reviewDeadline && Date.now() > this.dates.reviewDeadline;
});

// Method to calculate billing amount
workItemSchema.methods.calculateBilling = function() {
  let baseAmount = 0;
  
  if (this.billing.type === 'hourly') {
    baseAmount = (this.billing.billableHours || 0) * (this.billing.hourlyRate || 0);
  } else if (this.billing.type === 'fixed') {
    baseAmount = this.billing.fixedFee || 0;
  }
  
  // Calculate GST (18% for legal services in India)
  const gstAmount = Math.round((baseAmount * 18) / 100);
  const totalAmount = baseAmount + gstAmount;
  
  return {
    baseAmount: Math.round(baseAmount),
    gstAmount,
    totalAmount
  };
};

// Method to check if auto-approval is due
workItemSchema.methods.isAutoApprovalDue = function() {
  if (!this.autoApproval.isEnabled || this.status !== 'client_reviewing') {
    return false;
  }
  
  if (!this.dates.submittedAt) return false;
  
  const daysSinceSubmission = this.daysSinceSubmission;
  return daysSinceSubmission >= this.autoApproval.days;
};

// Method to add communication
workItemSchema.methods.addCommunication = function(from, to, message, messageType = 'info') {
  this.communications.push({
    from,
    to,
    message,
    messageType,
    sentAt: new Date()
  });
  return this.save();
};

// Method to update status with audit trail
workItemSchema.methods.updateStatus = function(newStatus, changedBy, reason = '') {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add to audit trail
  this.audit.statusHistory.push({
    status: oldStatus,
    changedAt: new Date(),
    changedBy,
    reason
  });
  
  this.audit.lastModifiedBy = changedBy;
  
  // Update relevant dates
  const now = new Date();
  switch (newStatus) {
    case 'in_progress':
      if (!this.dates.startedAt) this.dates.startedAt = now;
      break;
    case 'submitted':
      this.dates.submittedAt = now;
      // Set review deadline (3 days default)
      this.dates.reviewDeadline = new Date(now.getTime() + (this.autoApproval.days * 24 * 60 * 60 * 1000));
      break;
    case 'approved':
      this.dates.approvedAt = now;
      break;
    case 'completed':
      this.dates.completedAt = now;
      break;
  }
  
  return this.save();
};

// Pre-save middleware to calculate billing
workItemSchema.pre('save', function(next) {
  if (this.isModified('billing') || this.isNew) {
    const billing = this.calculateBilling();
    this.billing.baseAmount = billing.baseAmount;
    this.billing.gstAmount = billing.gstAmount;
    this.billing.totalAmount = billing.totalAmount;
  }
  next();
});

// Static method to get pending reviews
workItemSchema.statics.getPendingReviews = function(clientId) {
  return this.find({
    client: clientId,
    status: 'client_reviewing',
    'dates.reviewDeadline': { $gte: new Date() }
  }).populate('lawyer case').sort({ 'dates.submittedAt': 1 });
};

// Static method to get overdue items for auto-approval
workItemSchema.statics.getOverdueForAutoApproval = function() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 3); // 3 days ago
  
  return this.find({
    status: 'client_reviewing',
    'autoApproval.isEnabled': true,
    'dates.submittedAt': { $lte: cutoffDate }
  }).populate('client lawyer case');
};

// Static method to get lawyer work statistics
workItemSchema.statics.getLawyerStats = function(lawyerId, startDate, endDate) {
  const matchStage = {
    lawyer: mongoose.Types.ObjectId(lawyerId)
  };
  
  if (startDate && endDate) {
    matchStage.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$billing.totalAmount' },
        avgAmount: { $avg: '$billing.totalAmount' },
        totalHours: { $sum: '$billing.billableHours' }
      }
    }
  ]);
};

module.exports = mongoose.model('WorkItem', workItemSchema);
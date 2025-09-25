const mongoose = require('mongoose');

// Time Tracking model for lawyer billing
const timeTrackingSchema = new mongoose.Schema({
  // Case and Lawyer
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Time Entry Details
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Time tracking
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  
  // Duration in minutes
  duration: {
    type: Number, // Duration in minutes
    required: true,
    min: 0
  },
  
  // Work Description
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Activity Type
  activityType: {
    type: String,
    enum: [
      'consultation',
      'research',
      'document_drafting',
      'court_appearance',
      'client_meeting',
      'case_preparation',
      'correspondence',
      'filing',
      'review',
      'negotiation',
      'travel',
      'other'
    ],
    required: true
  },
  
  // Billing Information
  billing: {
    billable: {
      type: Boolean,
      default: true
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    invoiced: {
      type: Boolean,
      default: false
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    }
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'draft',      // Not yet submitted
      'submitted',  // Submitted for approval
      'approved',   // Approved by client/admin
      'rejected',   // Rejected
      'invoiced'    // Included in invoice
    ],
    default: 'draft'
  },
  
  // Timer Information (for active tracking)
  timer: {
    isActive: {
      type: Boolean,
      default: false
    },
    pausedDuration: {
      type: Number,
      default: 0 // Total paused time in minutes
    },
    breaks: [{
      startTime: Date,
      endTime: Date,
      reason: String
    }]
  },
  
  // Client approval (if required)
  clientApproval: {
    required: {
      type: Boolean,
      default: false
    },
    approved: Boolean,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String
  },
  
  // Tags for categorization
  tags: [String],
  
  // Attachments (screenshots, documents)
  attachments: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['screenshot', 'document', 'image', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Location tracking (optional)
  location: {
    type: String,
    enum: ['office', 'court', 'client_site', 'home', 'travel', 'other']
  },
  
  // Expense tracking (if applicable)
  expenses: [{
    description: String,
    amount: Number,
    category: {
      type: String,
      enum: ['travel', 'meals', 'filing_fees', 'copying', 'other']
    },
    receipt: String // URL to receipt
  }],
  
  // Review and feedback
  review: {
    internalNotes: String, // Lawyer's private notes
    qualityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    efficiency: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Modification tracking
  modificationHistory: [{
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String,
    previousValues: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes for better performance
timeTrackingSchema.index({ case: 1, date: -1 });
timeTrackingSchema.index({ lawyer: 1, date: -1 });
timeTrackingSchema.index({ client: 1, date: -1 });
timeTrackingSchema.index({ status: 1, date: -1 });
timeTrackingSchema.index({ 'billing.billable': 1, 'billing.invoiced': 1 });

// Pre-save middleware to calculate amount
timeTrackingSchema.pre('save', function(next) {
  // Calculate amount based on duration and hourly rate
  const hours = this.duration / 60;
  this.billing.amount = Math.round(hours * this.billing.hourlyRate * 100) / 100;
  
  // If endTime is not set but duration is, calculate endTime
  if (!this.endTime && this.startTime && this.duration) {
    this.endTime = new Date(this.startTime.getTime() + (this.duration * 60 * 1000));
  }
  
  // If both startTime and endTime are set, calculate duration
  if (this.startTime && this.endTime && !this.duration) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  }
  
  next();
});

// Method to start timer
timeTrackingSchema.methods.startTimer = function() {
  this.timer.isActive = true;
  this.startTime = new Date();
  return this.save();
};

// Method to pause timer
timeTrackingSchema.methods.pauseTimer = function(reason) {
  if (this.timer.isActive) {
    this.timer.breaks.push({
      startTime: new Date(),
      reason: reason || 'Manual pause'
    });
  }
  return this.save();
};

// Method to resume timer
timeTrackingSchema.methods.resumeTimer = function() {
  if (this.timer.breaks.length > 0) {
    const lastBreak = this.timer.breaks[this.timer.breaks.length - 1];
    if (!lastBreak.endTime) {
      lastBreak.endTime = new Date();
      const breakDuration = Math.round((lastBreak.endTime - lastBreak.startTime) / (1000 * 60));
      this.timer.pausedDuration += breakDuration;
    }
  }
  return this.save();
};

// Method to stop timer
timeTrackingSchema.methods.stopTimer = function() {
  if (this.timer.isActive) {
    this.endTime = new Date();
    this.timer.isActive = false;
    
    // Calculate total duration excluding breaks
    const totalDuration = Math.round((this.endTime - this.startTime) / (1000 * 60));
    this.duration = totalDuration - this.timer.pausedDuration;
    
    // Complete any ongoing break
    if (this.timer.breaks.length > 0) {
      const lastBreak = this.timer.breaks[this.timer.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = this.endTime;
        const breakDuration = Math.round((lastBreak.endTime - lastBreak.startTime) / (1000 * 60));
        this.timer.pausedDuration += breakDuration;
        this.duration -= breakDuration;
      }
    }
  }
  return this.save();
};

// Method to submit for approval
timeTrackingSchema.methods.submitForApproval = function() {
  this.status = 'submitted';
  return this.save();
};

// Method to approve time entry
timeTrackingSchema.methods.approve = function(approvedBy, comments) {
  this.status = 'approved';
  this.clientApproval.approved = true;
  this.clientApproval.approvedAt = new Date();
  this.clientApproval.approvedBy = approvedBy;
  this.clientApproval.comments = comments;
  return this.save();
};

// Method to reject time entry
timeTrackingSchema.methods.reject = function(comments) {
  this.status = 'rejected';
  this.clientApproval.approved = false;
  this.clientApproval.comments = comments;
  return this.save();
};

// Static method to get time entries by case
timeTrackingSchema.statics.getTimeEntriesByCase = function(caseId, filters = {}) {
  const query = { case: caseId, ...filters };
  return this.find(query)
    .populate('lawyer', 'name email')
    .populate('invoice', 'invoiceNumber status')
    .sort({ date: -1, startTime: -1 });
};

// Static method to get billable hours for lawyer
timeTrackingSchema.statics.getBillableHours = function(lawyerId, startDate, endDate) {
  const query = {
    lawyer: lawyerId,
    'billing.billable': true,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalHours: { $sum: { $divide: ['$duration', 60] } },
        totalAmount: { $sum: '$billing.amount' },
        entriesCount: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get uninvoiced time entries
timeTrackingSchema.statics.getUninvoicedEntries = function(lawyerId, caseId = null) {
  const query = {
    lawyer: lawyerId,
    'billing.billable': true,
    'billing.invoiced': false,
    status: { $in: ['approved', 'submitted'] }
  };
  
  if (caseId) query.case = caseId;
  
  return this.find(query)
    .populate('case', 'title caseNumber')
    .populate('client', 'name email')
    .sort({ date: -1 });
};

// Static method to get daily time summary
timeTrackingSchema.statics.getDailySummary = function(lawyerId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        lawyer: lawyerId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }
    },
    {
      $group: {
        _id: '$activityType',
        totalDuration: { $sum: '$duration' },
        totalAmount: { $sum: '$billing.amount' },
        entries: { $sum: 1 }
      }
    },
    {
      $sort: { totalDuration: -1 }
    }
  ]);
};

module.exports = mongoose.model('TimeTracking', timeTrackingSchema);
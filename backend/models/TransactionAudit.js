const mongoose = require('mongoose');

// Transaction Audit Schema for RBI compliance and security
const transactionAuditSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  // Related Payment Reference
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true,
    index: true
  },
  
  // Transaction Details
  transactionType: {
    type: String,
    enum: [
      'payment_initiation',
      'payment_capture',
      'payment_refund',
      'escrow_hold',
      'escrow_release',
      'dispute_raised',
      'dispute_resolved',
      'auto_approval',
      'manual_intervention'
    ],
    required: true,
    index: true
  },
  
  // Amount Details (for audit trail)
  amounts: {
    original: {
      type: Number,
      required: true,
      min: 0
    },
    processed: {
      type: Number,
      required: true,
      min: 0
    },
    fees: {
      gateway: {
        type: Number,
        default: 0,
        min: 0
      },
      platform: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    taxes: {
      gst: {
        type: Number,
        default: 0,
        min: 0
      },
      tds: {
        type: Number,
        default: 0,
        min: 0
      }
    }
  },
  
  // User and System Information
  initiatedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['client', 'lawyer', 'admin', 'system'],
      required: true
    },
    ipAddress: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          // Basic IP validation
          return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(v) || 
                 /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(v);
        },
        message: 'Invalid IP address format'
      }
    },
    userAgent: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
      isMobile: Boolean
    }
  },
  
  // Gateway Information (for payment tracking)
  gateway: {
    provider: {
      type: String,
      enum: ['razorpay', 'payu', 'cashfree', 'instamojo', 'manual'],
      required: true
    },
    transactionId: String,
    orderId: String,
    paymentMethod: {
      type: String,
      enum: [
        'upi', 'net_banking', 'debit_card', 'credit_card', 
        'wallet', 'bank_transfer', 'cash', 'cheque'
      ]
    },
    bankReference: String,
    gatewayResponse: {
      status: String,
      message: String,
      code: String,
      timestamp: Date
    }
  },
  
  // Security and Fraud Detection
  security: {
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    riskFactors: [{
      factor: {
        type: String,
        enum: [
          'unusual_amount',
          'new_device',
          'unusual_location',
          'rapid_transactions',
          'failed_attempts',
          'suspicious_pattern'
        ]
      },
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      },
      description: String
    }],
    fraudDetectionResults: {
      isBlocked: {
        type: Boolean,
        default: false
      },
      blockReason: String,
      blockedAt: Date,
      reviewRequired: {
        type: Boolean,
        default: false
      }
    },
    authenticationMethod: {
      type: String,
      enum: ['password', 'otp', '2fa', 'biometric', 'none'],
      default: 'password'
    }
  },
  
  // Compliance Information
  compliance: {
    kycStatus: {
      type: String,
      enum: ['verified', 'pending', 'rejected', 'not_required'],
      default: 'not_required'
    },
    amlCheck: {
      status: {
        type: String,
        enum: ['cleared', 'flagged', 'under_review', 'not_applicable'],
        default: 'not_applicable'
      },
      checkedAt: Date,
      flags: [String]
    },
    dataLocalization: {
      isCompliant: {
        type: Boolean,
        default: true
      },
      dataLocation: {
        type: String,
        default: 'India'
      }
    },
    rbiCompliance: {
      isCompliant: {
        type: Boolean,
        default: true
      },
      complianceNotes: String
    }
  },
  
  // Status and Processing Information
  status: {
    type: String,
    enum: [
      'initiated',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'disputed',
      'refunded',
      'under_review'
    ],
    required: true,
    default: 'initiated',
    index: true
  },
  
  // Error Information (if any)
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed,
    occurredAt: Date,
    resolvedAt: Date,
    resolution: String
  },
  
  // Processing Times (for performance monitoring)
  timing: {
    initiatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    processedAt: Date,
    completedAt: Date,
    processingTimeMs: Number,
    gatewayResponseTimeMs: Number
  },
  
  // Additional Metadata
  metadata: {
    caseReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case'
    },
    workItemReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkItem'
    },
    sessionId: String,
    requestId: String,
    batchId: String, // For bulk operations
    parentTransactionId: String, // For refunds/reversals
    notes: String,
    tags: [String]
  },
  
  // Notification Tracking
  notifications: {
    smsNotifications: [{
      recipient: String,
      message: String,
      sentAt: Date,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed'],
        default: 'sent'
      },
      provider: String
    }],
    emailNotifications: [{
      recipient: String,
      subject: String,
      sentAt: Date,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'opened', 'failed'],
        default: 'sent'
      }
    }],
    pushNotifications: [{
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      sentAt: Date,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'clicked', 'failed'],
        default: 'sent'
      }
    }]
  }
}, {
  timestamps: true,
  // Enable encryption for sensitive data
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive information from JSON output
      delete ret.initiatedBy.ipAddress;
      delete ret.initiatedBy.userAgent;
      delete ret.gateway.gatewayResponse;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance and compliance queries
transactionAuditSchema.index({ payment: 1, createdAt: -1 });
transactionAuditSchema.index({ transactionType: 1, status: 1 });
transactionAuditSchema.index({ 'initiatedBy.user': 1, createdAt: -1 });
transactionAuditSchema.index({ 'gateway.provider': 1, 'gateway.transactionId': 1 });
transactionAuditSchema.index({ 'timing.initiatedAt': -1 });
transactionAuditSchema.index({ 'security.fraudDetectionResults.isBlocked': 1 });
transactionAuditSchema.index({ 'security.fraudDetectionResults.reviewRequired': 1 });

// Virtual for processing duration
transactionAuditSchema.virtual('processingDuration').get(function() {
  if (this.timing.completedAt && this.timing.initiatedAt) {
    return this.timing.completedAt - this.timing.initiatedAt;
  }
  return null;
});

// Virtual for formatted processing time
transactionAuditSchema.virtual('processingTimeFormatted').get(function() {
  const duration = this.processingDuration;
  if (!duration) return 'N/A';
  
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
});

// Method to add risk factor
transactionAuditSchema.methods.addRiskFactor = function(factor, severity, description) {
  this.security.riskFactors.push({ factor, severity, description });
  
  // Recalculate risk score based on factors
  const severityScores = { low: 10, medium: 25, high: 50, critical: 100 };
  this.security.riskScore = Math.min(100, 
    this.security.riskFactors.reduce((score, rf) => 
      score + severityScores[rf.severity], 0
    )
  );
  
  return this.save();
};

// Method to update processing status
transactionAuditSchema.methods.updateStatus = function(newStatus, errorInfo = null) {
  this.status = newStatus;
  
  if (errorInfo) {
    this.error = {
      ...errorInfo,
      occurredAt: new Date()
    };
  }
  
  // Update timing based on status
  const now = new Date();
  switch (newStatus) {
    case 'processing':
      this.timing.processedAt = now;
      break;
    case 'completed':
    case 'failed':
    case 'cancelled':
      this.timing.completedAt = now;
      if (this.timing.initiatedAt) {
        this.timing.processingTimeMs = now - this.timing.initiatedAt;
      }
      break;
  }
  
  return this.save();
};

// Method to add notification
transactionAuditSchema.methods.addNotification = function(type, details) {
  const notification = {
    ...details,
    sentAt: new Date()
  };
  
  switch (type) {
    case 'sms':
      this.notifications.smsNotifications.push(notification);
      break;
    case 'email':
      this.notifications.emailNotifications.push(notification);
      break;
    case 'push':
      this.notifications.pushNotifications.push(notification);
      break;
  }
  
  return this.save();
};

// Static method to get fraud statistics
transactionAuditSchema.statics.getFraudStats = function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage['timing.initiatedAt'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          isBlocked: '$security.fraudDetectionResults.isBlocked',
          reviewRequired: '$security.fraudDetectionResults.reviewRequired'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amounts.processed' },
        avgRiskScore: { $avg: '$security.riskScore' }
      }
    }
  ]);
};

// Static method to get performance metrics
transactionAuditSchema.statics.getPerformanceMetrics = function(startDate, endDate) {
  const matchStage = {
    'timing.completedAt': { $exists: true }
  };
  
  if (startDate && endDate) {
    matchStage['timing.initiatedAt'] = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$gateway.provider',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$timing.processingTimeMs' },
        successRate: {
          $avg: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        totalAmount: { $sum: '$amounts.processed' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Pre-save middleware for compliance checks
transactionAuditSchema.pre('save', function(next) {
  // Ensure data localization compliance
  if (!this.compliance.dataLocalization.isCompliant) {
    return next(new Error('Transaction must comply with data localization requirements'));
  }
  
  // Check for high-risk transactions
  if (this.security.riskScore > 80 && !this.security.fraudDetectionResults.reviewRequired) {
    this.security.fraudDetectionResults.reviewRequired = true;
  }
  
  next();
});

module.exports = mongoose.model('TransactionAudit', transactionAuditSchema);
const mongoose = require('mongoose');

// Payment model for Indian legal billing with escrow functionality
const paymentSchema = new mongoose.Schema({
  // Payment Identification
  paymentId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Case and Parties
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR']
  },
  
  // Indian Tax Information (GST)
  gst: {
    isApplicable: {
      type: Boolean,
      default: true
    },
    percentage: {
      type: Number,
      default: 18 // 18% GST for legal services in India
    },
    amount: {
      type: Number,
      default: 0
    },
    gstNumber: String // Lawyer's GST number
  },
  
  // Total amount including GST
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Payment Status (Escrow Flow)
  status: {
    type: String,
    enum: [
      'pending_payment',     // Client needs to pay
      'payment_received',    // Client paid, money in escrow
      'work_submitted',      // Lawyer submitted work
      'client_reviewing',    // Client reviewing work
      'approved',           // Client approved work
      'payment_released',   // Money released to lawyer
      'disputed',           // Payment disputed
      'refunded',           // Money refunded to client
      'cancelled'           // Payment cancelled
    ],
    default: 'pending_payment'
  },
  
  // Payment Method (Indian)
  paymentMethod: {
    type: String,
    enum: [
      'upi',
      'net_banking',
      'debit_card',
      'credit_card',
      'wallet',
      'bank_transfer'
    ]
  },
  
  // Gateway Information
  gateway: {
    provider: {
      type: String,
      enum: ['razorpay', 'payu', 'cashfree', 'instamojo'],
      default: 'razorpay'
    },
    transactionId: String,
    orderId: String,
    signature: String
  },
  
  // Escrow Details
  escrow: {
    holdingPeriod: {
      type: Number,
      default: 7 // 7 days default holding period
    },
    releaseDate: Date,
    autoRelease: {
      type: Boolean,
      default: true
    }
  },
  
  // Work Submission
  workSubmission: {
    submittedAt: Date,
    description: String,
    documents: [{
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    lawyerNotes: String
  },
  
  // Client Review
  clientReview: {
    reviewedAt: Date,
    approved: Boolean,
    feedback: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  // Dispute Information
  dispute: {
    raisedBy: {
      type: String,
      enum: ['client', 'lawyer']
    },
    raisedAt: Date,
    reason: String,
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'escalated']
    },
    resolution: String,
    resolvedAt: Date
  },
  
  // Payment Timeline
  timeline: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Service-based payment
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalService'
  },
  
  // Invoice reference
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  
  // Additional metadata
  metadata: {
    ip: String,
    userAgent: String,
    clientLocation: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ case: 1, status: 1 });
paymentSchema.index({ client: 1, createdAt: -1 });
paymentSchema.index({ lawyer: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Pre-save middleware to generate payment ID
paymentSchema.pre('save', async function(next) {
  if (!this.paymentId) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentId = `PAY-${year}${month}-${random}`;
  }
  
  // Calculate GST and total amount
  if (this.gst.isApplicable) {
    this.gst.amount = Math.round((this.amount * this.gst.percentage) / 100);
    this.totalAmount = this.amount + this.gst.amount;
  } else {
    this.gst.amount = 0;
    this.totalAmount = this.amount;
  }
  
  next();
});

// Methods for payment status updates
paymentSchema.methods.updateStatus = function(status, description, updatedBy) {
  this.status = status;
  this.timeline.push({
    status,
    description,
    updatedBy,
    timestamp: new Date()
  });
  
  // Set release date for escrow
  if (status === 'payment_received') {
    this.escrow.releaseDate = new Date(Date.now() + (this.escrow.holdingPeriod * 24 * 60 * 60 * 1000));
  }
  
  return this.save();
};

// Static method to get payments by case
paymentSchema.statics.getPaymentsByCase = function(caseId) {
  return this.find({ case: caseId })
    .populate('client', 'name email')
    .populate('lawyer', 'name email')
    .populate('invoice')
    .sort({ createdAt: -1 });
};

// Static method to get payments for lawyer dashboard
paymentSchema.statics.getLawyerPayments = function(lawyerId, status = null) {
  const query = { lawyer: lawyerId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('client', 'name email')
    .populate('case', 'title caseNumber')
    .populate('invoice')
    .sort({ createdAt: -1 });
};

// Static method to get payments for client dashboard
paymentSchema.statics.getClientPayments = function(clientId, status = null) {
  const query = { client: clientId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('lawyer', 'name email')
    .populate('case', 'title caseNumber')
    .populate('invoice')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Payment', paymentSchema);
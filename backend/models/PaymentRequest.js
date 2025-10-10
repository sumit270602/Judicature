
const mongoose = require('mongoose');

const paymentRequestSchema = new mongoose.Schema({
  // Basic information
  requestId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties involved
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
  
  // Payment details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  
  // Service details
  serviceType: {
    type: String,
    required: true,
    enum: [
      'consultation', 
      'document_review', 
      'contract_drafting', 
      'legal_research', 
      'court_representation',
      'legal_notice',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Request status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'paid', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  
  // Payment information
  orderId: {
    type: String,
    sparse: true // Only set when payment is initiated
  },
  paymentIntentId: {
    type: String,
    sparse: true
  },
  
  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  
  // Expiry
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  
  // Additional metadata
  metadata: {
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    estimatedDeliveryDays: {
      type: Number,
      min: 1,
      max: 365,
      default: 7
    }
  },
  
  // Communication
  clientNotes: {
    type: String,
    maxlength: 1000
  },
  lawyerNotes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
paymentRequestSchema.index({ requestId: 1 });
paymentRequestSchema.index({ lawyer: 1, createdAt: -1 });
paymentRequestSchema.index({ client: 1, createdAt: -1 });
paymentRequestSchema.index({ status: 1, createdAt: -1 });
paymentRequestSchema.index({ expiresAt: 1 });

// Virtual for total amount including fees
paymentRequestSchema.virtual('totalAmount').get(function() {
  const gst = this.amount * 0.18;
  const platformFee = this.amount * 0.029;
  return Math.round(this.amount + gst + platformFee);
});

// Virtual for fee breakdown
paymentRequestSchema.virtual('feeBreakdown').get(function() {
  const baseAmount = this.amount;
  const gst = Math.round(baseAmount * 0.18);
  const platformFee = Math.round(baseAmount * 0.029);
  const total = baseAmount + gst + platformFee;
  
  return {
    baseAmount,
    gst,
    platformFee,
    total
  };
});

// Generate unique request ID
paymentRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    const count = await mongoose.model('PaymentRequest').countDocuments();
    this.requestId = `PAY-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Update respondedAt when status changes from pending
paymentRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Instance methods
paymentRequestSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

paymentRequestSchema.methods.canBePaid = function() {
  return this.status === 'accepted' && !this.isExpired();
};

paymentRequestSchema.methods.canBeCancelled = function() {
  return ['pending', 'accepted'].includes(this.status) && !this.isExpired();
};

// Static methods
paymentRequestSchema.statics.findByRequestId = function(requestId) {
  return this.findOne({ requestId }).populate('lawyer client', 'name email role');
};

paymentRequestSchema.statics.findActiveByClient = function(clientId) {
  return this.find({
    client: clientId,
    status: { $in: ['pending', 'accepted', 'paid'] },
    expiresAt: { $gt: new Date() }
  }).populate('lawyer', 'name email').sort({ createdAt: -1 });
};

paymentRequestSchema.statics.findActiveByLawyer = function(lawyerId) {
  return this.find({
    lawyer: lawyerId,
    status: { $in: ['pending', 'accepted', 'paid'] },
    expiresAt: { $gt: new Date() }
  }).populate('client', 'name email').sort({ createdAt: -1 });
};

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
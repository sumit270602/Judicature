const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Identification
  id: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties involved
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Case reference (optional)
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case'
  },
  
  // Payment request reference (if created from payment request)
  paymentRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentRequest'
  },
  
  // Financial details
  amountCents: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'inr',
    enum: ['inr', 'usd']
  },
  
  // Platform fee calculation
  platformFeeCents: {
    type: Number,
    required: true,
    min: 0
  },
  lawyerAmountCents: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Order status
  status: {
    type: String,
    enum: [
      'created',      // Order created, payment not yet attempted
      'funded',       // Payment successful, funds held in escrow
      'in_progress',  // Work started by lawyer
      'delivered',    // Deliverable uploaded by lawyer
      'completed',    // Client accepted deliverable, funds released
      'disputed',     // Client raised dispute
      'refunded',     // Funds returned to client
      'cancelled'     // Order cancelled
    ],
    default: 'created'
  },
  
  // Stripe integration
  stripePaymentIntentId: {
    type: String,
    required: true
  },
  stripeTransferGroupId: {
    type: String
  },
  
  // Metadata
  description: {
    type: String,
    maxlength: 500
  },
  
  // Dispute information
  disputeReason: {
    type: String
  },
  disputeAttachments: [{
    type: String // URLs to dispute evidence
  }],
  disputeCreatedAt: {
    type: Date
  },
  
  // Timeline tracking
  fundedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate unique order ID
orderSchema.statics.generateOrderId = function() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};

// Calculate amounts based on platform fee
orderSchema.statics.calculateAmounts = function(totalAmountCents, platformFeePercent) {
  const platformFeeCents = Math.round(totalAmountCents * (platformFeePercent / 100));
  const lawyerAmountCents = totalAmountCents - platformFeeCents;
  
  return {
    amountCents: totalAmountCents,
    platformFeeCents,
    lawyerAmountCents
  };
};

// Instance methods
orderSchema.methods.canBeDisputed = function() {
  return ['funded', 'in_progress', 'delivered'].includes(this.status);
};

orderSchema.methods.canBeCompleted = function() {
  return this.status === 'delivered';
};

orderSchema.methods.canBeRefunded = function() {
  return ['funded', 'in_progress', 'disputed'].includes(this.status);
};

// Indexes for performance
orderSchema.index({ clientId: 1, status: 1 });
orderSchema.index({ lawyerId: 1, status: 1 });
orderSchema.index({ stripePaymentIntentId: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
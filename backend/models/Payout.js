
const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema({
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Lawyer receiving payout
  lawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Stripe transfer details
  transferId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Financial details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  fee: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'inr',
    enum: ['inr', 'usd']
  },
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',     // Transfer initiated but not processed
      'in_transit',  // Transfer in progress
      'paid',        // Successfully transferred to lawyer
      'failed',      // Transfer failed
      'reversed',    // Transfer was reversed
      'cancelled'    // Transfer was cancelled
    ],
    default: 'pending'
  },
  
  // Hold information
  isOnHold: {
    type: Boolean,
    default: false
  },
  holdReason: {
    type: String,
    enum: ['new_lawyer', 'risk_review', 'dispute', 'verification'],
    default: 'new_lawyer'
  },
  holdUntil: {
    type: Date
  },
  holdReleasedAt: {
    type: Date
  },
  
  // Stripe webhook tracking
  stripeEventId: {
    type: String
  },
  
  // Failure information
  failureCode: {
    type: String
  },
  failureMessage: {
    type: String
  },
  
  // Timeline
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  failedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Static methods
payoutSchema.statics.calculateHoldPeriod = function(lawyerCreatedAt) {
  const now = new Date();
  const lawyerAge = now - new Date(lawyerCreatedAt);
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
  
  // New lawyers (< 30 days) get 14-day hold
  // Established lawyers (>= 30 days) get 7-day hold
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  const holdDuration = lawyerAge < thirtyDaysInMs ? fourteenDaysInMs : sevenDaysInMs;
  
  return new Date(now.getTime() + holdDuration);
};

// Instance methods
payoutSchema.methods.canBeReleased = function() {
  if (!this.isOnHold) return true;
  if (!this.holdUntil) return false;
  return new Date() >= this.holdUntil;
};

payoutSchema.methods.releaseHold = function() {
  this.isOnHold = false;
  this.holdReleasedAt = new Date();
  return this.save();
};

// Indexes
payoutSchema.index({ lawyerId: 1, status: 1 });
payoutSchema.index({ orderId: 1 });
payoutSchema.index({ transferId: 1 });
payoutSchema.index({ holdUntil: 1 });
payoutSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payout', payoutSchema);
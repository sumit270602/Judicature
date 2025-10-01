const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  // Order reference
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // File information
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  
  // File integrity
  hash: {
    type: String,
    required: true
  },
  
  // Digital signature (optional)
  signedDocUrl: {
    type: String
  },
  signatureHash: {
    type: String
  },
  
  // Description and notes
  description: {
    type: String,
    maxlength: 1000
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  
  // Lawyer who uploaded
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Client acceptance
  acceptedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acceptedAt: {
    type: Date
  },
  acceptanceNotes: {
    type: String,
    maxlength: 1000
  },
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'uploaded',   // Deliverable uploaded by lawyer
      'accepted',   // Accepted by client
      'rejected',   // Rejected by client
      'disputed'    // Under dispute
    ],
    default: 'uploaded'
  },
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  previousVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deliverable'
  }
}, {
  timestamps: true
});

// Generate file hash for integrity checking
deliverableSchema.statics.generateFileHash = function(fileBuffer) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
};

// Instance methods
deliverableSchema.methods.canBeAccepted = function() {
  return this.status === 'uploaded';
};

deliverableSchema.methods.canBeRejected = function() {
  return this.status === 'uploaded';
};

// Indexes
deliverableSchema.index({ orderId: 1 });
deliverableSchema.index({ uploadedBy: 1 });
deliverableSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Deliverable', deliverableSchema);
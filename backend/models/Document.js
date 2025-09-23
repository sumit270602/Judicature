const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Basic file info
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, max: 10485760 }, // 10MB
  fileData: { type: Buffer, required: true },
  
  // Document classification
  documentType: {
    type: String,
    enum: ['bar_certificate', 'license', 'identity', 'case_document'],
    required: true
  },
  isVerificationDoc: { type: Boolean, default: false },
  
  // Basic relationships
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  relatedCase: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' }, // Only for case docs
  
  // Simple approval
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String }
}, {
  timestamps: true
});

// Simple methods
documentSchema.statics.getUserDocs = function(userId) {
  return this.find({ uploadedBy: userId }).sort({ createdAt: -1 });
};

documentSchema.statics.getCaseDocs = function(caseId) {
  return this.find({ relatedCase: caseId }).populate('uploadedBy', 'name').sort({ createdAt: -1 });
};

documentSchema.statics.getPendingDocs = function() {
  return this.find({ status: 'pending' }).populate('uploadedBy', 'name email').sort({ createdAt: 1 });
};

module.exports = mongoose.model('Document', documentSchema);

const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  // Basic file info (enhanced from both versions)
  fileName: { 
    type: String, 
    required: true 
  },
  originalName: { 
    type: String, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true,
    max: 10485760 // 10MB limit
  },
  fileData: { 
    type: Buffer, 
    required: true 
  },
  
  // Document classification (from remote version)
  documentType: {
    type: String,
    required: true
  },
  isVerificationDoc: { 
    type: Boolean, 
    default: false 
  },
  
  // Relationships
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  relatedCase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Case' 
  },
  
  // Document metadata
  tags: [String],
  isPrivate: { 
    type: Boolean, 
    default: false 
  },
  version: { 
    type: Number, 
    default: 1 
  },
  status: { 
    type: String, 
    enum: ['pending', 'processed', 'approved', 'rejected'], 
    default: 'pending' 
  },
  
  // Review information (from remote version)
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewNotes: { 
    type: String 
  },
  
  // AI Analysis Results (our comprehensive version)
  aiAnalysis: {
    summary: String,
    keyPoints: [String],
    risks: [String],
    recommendations: [String],
    confidenceScore: Number,
    analyzedAt: Date
  },
  
  // Access tracking
  downloadCount: { 
    type: Number, 
    default: 0 
  },
  lastAccessedAt: Date,
  
  // Version control
  parentDocument: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document' 
  },
  isLatestVersion: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Indexes for performance (enhanced from our version)
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ relatedCase: 1, createdAt: -1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ filename: 'text', originalName: 'text' });
documentSchema.index({ documentType: 1 });

// Static methods (combined from both versions)
documentSchema.statics.getUserDocs = function(userId) {
  return this.find({ uploadedBy: userId })
    .sort({ createdAt: -1 })
    .populate('relatedCase', 'title caseNumber');
};

documentSchema.statics.getCaseDocs = function(caseId) {
  return this.find({ relatedCase: caseId })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email');
};

// Keep old method names for backward compatibility
documentSchema.statics.getUserDocuments = function(userId) {
  return this.getUserDocs(userId);
};

documentSchema.statics.getCaseDocuments = function(caseId) {
  return this.getCaseDocs(caseId);
};

documentSchema.statics.getPendingDocs = function() {
  return this.find({ status: 'pending' })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: 1 });
};

documentSchema.statics.searchDocuments = function(userId, query) {
  return this.find({
    uploadedBy: userId,
    $or: [
      { originalName: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
      { 'aiAnalysis.summary': { $regex: query, $options: 'i' } }
    ]
  }).sort({ createdAt: -1 });
};

// Instance methods (from our comprehensive version)
documentSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastAccessedAt = new Date();
  return this.save();
};

documentSchema.methods.createNewVersion = function(newDocumentData) {
  // Mark current document as not latest
  this.isLatestVersion = false;
  
  // Create new version
  const newVersion = new this.constructor({
    ...newDocumentData,
    parentDocument: this._id,
    version: this.version + 1,
    relatedCase: this.relatedCase,
    tags: this.tags,
    isLatestVersion: true
  });
  
  return Promise.all([this.save(), newVersion.save()]);
};

module.exports = mongoose.model('Document', documentSchema);
const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { 
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
  size: { 
    type: Number, 
    required: true 
  },
  cloudinaryUrl: { 
    type: String, 
    required: true 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  relatedCase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Case' 
  },
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
    enum: ['pending', 'processed', 'approved'], 
    default: 'pending' 
  },
  // AI Analysis Results
  aiAnalysis: {
    summary: String,
    keyPoints: [String],
    risks: [String],
    recommendations: [String],
    confidenceScore: Number,
    analyzedAt: Date
  },
  // Document metadata
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

// Indexes for performance
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ relatedCase: 1, createdAt: -1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ filename: 'text', originalName: 'text' });

// Static methods
documentSchema.statics.getUserDocuments = function(userId) {
  return this.find({ uploadedBy: userId })
    .sort({ createdAt: -1 })
    .populate('relatedCase', 'title caseNumber');
};

documentSchema.statics.getCaseDocuments = function(caseId) {
  return this.find({ relatedCase: caseId })
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'name email');
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

// Instance methods
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
const mongoose = require('mongoose');

// Simplified User Schema for MVP
const userSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'lawyer', 'admin'], default: 'client' },
  
  // Contact Information (simplified)
  phone: { type: String },
  address: { type: String },
  
  // Professional Information (only for lawyers)
  barCouncilId: { type: String }, // Only required for lawyers
  practiceAreas: [{ 
    type: String, 
    enum: ['civil', 'criminal', 'family', 'corporate', 'other']
  }],
  experience: { type: Number }, // years of experience
  hourlyRate: { type: Number },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Lawyer Verification System
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'under_review', 'verified', 'rejected', 'suspended'],
    default: function() {
      return this.role === 'lawyer' ? 'pending' : 'verified';
    }
  },
  verificationDocuments: [{
    type: { 
      type: String, 
      enum: ['bar_certificate', 'license', 'identity', 'practice_certificate'] 
    },
    url: String, // Cloudinary URL
    originalName: String,
    uploadedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  verificationNotes: String, // Admin notes for rejection/approval
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who verified
  verificationRequestedAt: Date,
  
  // Simple Notifications
  emailNotifications: { type: Boolean, default: true },
  
  // Profile
  profilePicture: { type: String }, // Cloudinary URL
  bio: { type: String, maxlength: 500 }
}, {
  timestamps: true
});

// Simple static method to find available lawyers
userSchema.statics.findAvailableLawyers = function() {
  return this.find({
    role: 'lawyer',
    isActive: true,
    isVerified: true,
    verificationStatus: 'verified'
  });
};

// Method to check if lawyer can take cases
userSchema.methods.canTakeCases = function() {
  return this.role === 'lawyer' && 
         this.isActive && 
         this.isVerified && 
         this.verificationStatus === 'verified';
};

// Method to get verification progress
userSchema.methods.getVerificationProgress = function() {
  if (this.role !== 'lawyer') return null;
  
  const requiredDocs = ['bar_certificate', 'license', 'identity'];
  const uploadedDocs = this.verificationDocuments.map(doc => doc.type);
  const progress = (uploadedDocs.length / requiredDocs.length) * 100;
  
  return {
    progress: Math.round(progress),
    uploadedDocuments: uploadedDocs,
    missingDocuments: requiredDocs.filter(doc => !uploadedDocs.includes(doc)),
    status: this.verificationStatus
  };
};

// Index for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ verificationStatus: 1, role: 1 });

module.exports = mongoose.model('User', userSchema); 
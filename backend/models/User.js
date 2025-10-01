const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'lawyer', 'admin'], default: 'client' },
  
  // Contact Information
  phone: { type: String },
  address: { type: String },
  
  // Professional Information (only for lawyers)
  barCouncilId: { type: String },
  practiceAreas: [{ 
    type: String, 
    enum: ['civil', 'criminal', 'family', 'corporate', 'property', 'labor', 'tax', 'constitutional', 'intellectual', 'other']
  }],
  experience: { type: Number },
  hourlyRate: { type: Number },
  
  // Stripe Connect Integration (lawyers only)
  stripeAccountId: { type: String },
  stripeOnboardingComplete: { type: Boolean, default: false },
  payoutHoldUntil: { type: Date }, // Hold first N payouts for 7-14 days
  
  // Account Status
  isActive: { type: Boolean, default: true },
  
  // Simple Lawyer Verification
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: function() {
      return this.role === 'lawyer' ? 'pending' : 'verified';
    }
  },
  
  // Profile
  profilePicture: { type: String },
  bio: { type: String, maxlength: 500 }
}, {
  timestamps: true
});

// Find available lawyers
userSchema.statics.findAvailableLawyers = function() {
  return this.find({
    role: 'lawyer',
    isActive: true,
    verificationStatus: 'verified'
  });
};

// Check if lawyer can take cases
userSchema.methods.canTakeCases = function() {
  return this.role === 'lawyer' && 
         this.isActive && 
         this.verificationStatus === 'verified';
};

module.exports = mongoose.model('User', userSchema); 
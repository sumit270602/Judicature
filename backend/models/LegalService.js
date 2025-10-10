
const mongoose = require('mongoose');

// Legal Service Schema for service-based pricing
const legalServiceSchema = new mongoose.Schema({
  // Lawyer providing the service
  lawyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Service categorization
  category: { 
    type: String, 
    enum: [
      'personal_family',     // Personal / Family
      'criminal_property',   // Criminal / Property  
      'civil_debt',         // Civil / Debt Matters
      'corporate_law',      // Corporate Law
      'others'              // Others
    ],
    required: true 
  },
  
  // Specific service type within category
  serviceType: { 
    type: String, 
    required: true,
    enum: [
      // Personal / Family
      'divorce', 'family_dispute', 'child_custody', 'muslim_law', 
      'medical_negligence', 'motor_accident',
      
      // Criminal / Property
      'criminal_case', 'property_dispute', 'landlord_tenant', 
      'cyber_crime', 'wills_trusts', 'labour_service',
      
      // Civil / Debt Matters
      'documentation', 'consumer_court', 'civil_case', 
      'cheque_bounce', 'recovery',
      
      // Corporate Law
      'arbitration', 'trademark_copyright', 'customs_excise', 
      'startup_legal', 'banking_finance', 'gst_matters', 'corporate_compliance',
      
      // Others
      'armed_forces_tribunal', 'supreme_court', 'insurance_claims', 
      'immigration', 'international_law', 'other'
    ]
  },
  
  // Service details
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 500 
  },
  
  // Flexible pricing structure
  pricing: {
    type: { 
      type: String, 
      enum: ['fixed', 'hourly', 'range'], 
      required: true 
    },
    // For fixed pricing
    amount: { 
      type: Number,
      min: 0
    },
    // For range pricing
    minAmount: { 
      type: Number,
      min: 0
    },
    maxAmount: { 
      type: Number,
      min: 0
    },
    // For hourly pricing
    hourlyRate: { 
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    }
  },
  
  // Service specifications
  estimatedDuration: { 
    type: String,
    required: true // e.g., "2-3 weeks", "1-2 months"
  },
  
  // What client needs to provide
  requirements: [{
    type: String,
    maxlength: 100
  }],
  
  // Service deliverables
  deliverables: [{
    type: String,
    maxlength: 100
  }],
  
  // Service status
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  // Performance metrics
  metrics: {
    // Lawyer's experience with this specific service
    experienceYears: { 
      type: Number, 
      min: 0,
      default: 0
    },
    // Success rate for this service type
    successRate: { 
      type: Number, 
      min: 0, 
      max: 100,
      default: 0 
    },
    // Number of cases handled
    casesHandled: {
      type: Number,
      min: 0,
      default: 0
    },
    // Average rating for this service
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    // Number of reviews
    reviewCount: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  
  // Availability
  availability: {
    isAcceptingClients: {
      type: Boolean,
      default: true
    },
    maxCasesPerMonth: {
      type: Number,
      min: 1,
      default: 10
    },
    currentCaseLoad: {
      type: Number,
      min: 0,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
legalServiceSchema.index({ lawyer: 1, category: 1, serviceType: 1 });
legalServiceSchema.index({ category: 1, serviceType: 1, isActive: 1 });
legalServiceSchema.index({ 'pricing.amount': 1 });
legalServiceSchema.index({ 'pricing.minAmount': 1, 'pricing.maxAmount': 1 });
legalServiceSchema.index({ 'metrics.rating': -1 });

// Validation for pricing structure
legalServiceSchema.pre('save', function(next) {
  const pricing = this.pricing;
  
  if (pricing.type === 'fixed' && !pricing.amount) {
    return next(new Error('Fixed pricing requires an amount'));
  }
  
  if (pricing.type === 'range') {
    if (!pricing.minAmount || !pricing.maxAmount) {
      return next(new Error('Range pricing requires both minAmount and maxAmount'));
    }
    if (pricing.minAmount >= pricing.maxAmount) {
      return next(new Error('minAmount must be less than maxAmount'));
    }
  }
  
  if (pricing.type === 'hourly' && !pricing.hourlyRate) {
    return next(new Error('Hourly pricing requires an hourly rate'));
  }
  
  next();
});

// Static methods
legalServiceSchema.statics.findByCategory = function(category, isActive = true) {
  return this.find({ category, isActive })
    .populate('lawyer', 'name email phone barCouncilId experience verificationStatus rating')
    .sort({ 'metrics.rating': -1, 'metrics.casesHandled': -1 });
};

legalServiceSchema.statics.findByServiceType = function(serviceType, isActive = true) {
  return this.find({ serviceType, isActive })
    .populate('lawyer', 'name email phone barCouncilId experience verificationStatus rating')
    .sort({ 'metrics.rating': -1, 'pricing.amount': 1 });
};

legalServiceSchema.statics.findByPriceRange = function(minPrice, maxPrice, category = null) {
  const query = {
    isActive: true,
    $or: [
      { 'pricing.type': 'fixed', 'pricing.amount': { $gte: minPrice, $lte: maxPrice } },
      { 'pricing.type': 'range', 'pricing.minAmount': { $lte: maxPrice }, 'pricing.maxAmount': { $gte: minPrice } },
      { 'pricing.type': 'hourly', 'pricing.hourlyRate': { $gte: minPrice, $lte: maxPrice } }
    ]
  };
  
  if (category) {
    query.category = category;
  }
  
  return this.find(query)
    .populate('lawyer', 'name email phone barCouncilId experience verificationStatus rating')
    .sort({ 'metrics.rating': -1 });
};

// Instance methods
legalServiceSchema.methods.isAvailable = function() {
  return this.isActive && 
         this.availability.isAcceptingClients && 
         this.availability.currentCaseLoad < this.availability.maxCasesPerMonth;
};

legalServiceSchema.methods.getFormattedPrice = function() {
  const { type, amount, minAmount, maxAmount, hourlyRate, currency } = this.pricing;
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  
  switch (type) {
    case 'fixed':
      return `${symbol}${amount?.toLocaleString() || 0}`;
    case 'range':
      return `${symbol}${minAmount?.toLocaleString() || 0} - ${symbol}${maxAmount?.toLocaleString() || 0}`;
    case 'hourly':
      return `${symbol}${hourlyRate?.toLocaleString() || 0}/hour`;
    default:
      return 'Price on request';
  }
};

module.exports = mongoose.model('LegalService', legalServiceSchema);
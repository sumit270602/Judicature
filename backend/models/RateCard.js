
const mongoose = require('mongoose');

// Enhanced Rate Card Schema for Indian Legal Services with compliance
const rateCardSchema = new mongoose.Schema({
  // Lawyer Information
  lawyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  // Service Classification
  serviceType: {
    type: String,
    enum: [
      'hourly',           // Hourly billing for ongoing work
      'fixed',            // Fixed fee for specific services
      'consultation',     // One-time consultation charges
      'retainer',         // Monthly retainer fee
      'contingency',      // Contingency-based fee (% of settlement)
      'court_appearance', // Per court appearance fee
      'document_drafting' // Document preparation charges
    ],
    required: true,
    index: true
  },
  
  // Practice Area (Indian Legal Categories)
  practiceArea: {
    type: String,
    enum: [
      'civil_litigation',
      'criminal_law',
      'family_law',
      'corporate_law',
      'property_law',
      'labour_employment',
      'taxation',
      'intellectual_property',
      'banking_finance',
      'constitutional_law',
      'consumer_protection',
      'cyber_law',
      'immigration',
      'arbitration_mediation',
      'others'
    ],
    required: true,
    index: true
  },
  
  // Pricing Structure
  baseRate: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(v) {
        return v >= 500; // Minimum ₹500 per hour/service in India
      },
      message: 'Base rate must be at least ₹500'
    }
  },
  
  // Rate modifiers for complexity
  complexityMultipliers: {
    simple: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    moderate: {
      type: Number,
      default: 1.5,
      min: 0.5,
      max: 3.0
    },
    complex: {
      type: Number,
      default: 2.0,
      min: 0.5,
      max: 5.0
    }
  },
  
  // Experience-based pricing
  experienceTier: {
    type: String,
    enum: ['junior', 'senior', 'expert', 'specialist'],
    required: true
  },
  
  // Service Description
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  
  // Billing Terms
  billingTerms: {
    paymentSchedule: {
      type: String,
      enum: ['upfront', 'milestone', 'completion', 'monthly'],
      default: 'upfront'
    },
    advancePercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50 // 50% advance common in India
    },
    minimumBillableHours: {
      type: Number,
      min: 0,
      default: 0
    },
    cancellationPolicy: {
      type: String,
      maxlength: 200
    }
  },
  
  // Geographic Coverage
  jurisdiction: [{
    type: String,
    enum: [
      'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad',
      'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur',
      'indore', 'bhopal', 'visakhapatnam', 'patna', 'vadodara', 'ludhiana',
      'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan',
      'vasai', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar',
      'all_india', 'high_court_specific', 'supreme_court'
    ]
  }],
  
  // Availability
  availability: {
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    maxConcurrentCases: {
      type: Number,
      min: 1,
      max: 50,
      default: 10
    },
    responseTime: {
      type: String,
      enum: ['immediate', 'within_hour', 'within_day', 'within_week'],
      default: 'within_day'
    },
    workingHours: {
      start: {
        type: String,
        default: '09:00'
      },
      end: {
        type: String,
        default: '18:00'
      },
      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      }
    }
  },
  
  // Rate History (for transparency and auditing)
  rateHistory: [{
    previousRate: Number,
    changeDate: {
      type: Date,
      default: Date.now
    },
    changeReason: {
      type: String,
      maxlength: 200
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Success Metrics (for client confidence)
  metrics: {
    casesHandled: {
      type: Number,
      default: 0,
      min: 0
    },
    successRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    averageResolutionTime: {
      type: Number, // in days
      min: 0
    },
    clientSatisfactionScore: {
      type: Number,
      min: 1,
      max: 5,
      default: 4
    }
  },
  
  // Compliance and Legal Requirements
  compliance: {
    gstApplicable: {
      type: Boolean,
      default: true
    },
    gstPercentage: {
      type: Number,
      default: 18 // 18% GST for legal services in India
    },
    hsnCode: {
      type: String,
      default: '9991' // HSN code for legal services
    },
    stateBarCouncil: {
      type: String,
      required: function() {
        return this.lawyer.role === 'lawyer';
      }
    },
    practiceRegistrationNumber: String
  },
  
  // Client Reviews and Feedback
  reviews: [{
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxlength: 500
    },
    caseReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case'
    },
    reviewDate: {
      type: Date,
      default: Date.now
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  }],
  
  // Special Offers or Discounts
  offers: {
    firstTimeClientDiscount: {
      percentage: {
        type: Number,
        min: 0,
        max: 50,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: false
      }
    },
    bulkCaseDiscount: {
      minCases: Number,
      discountPercentage: Number,
      isActive: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true,
  // Enable text search on title and description
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
rateCardSchema.index({ lawyer: 1, practiceArea: 1 });
rateCardSchema.index({ practiceArea: 1, serviceType: 1 });
rateCardSchema.index({ baseRate: 1 });
rateCardSchema.index({ 'availability.isActive': 1 });
rateCardSchema.index({ experienceTier: 1 });
rateCardSchema.index({ createdAt: -1 });

// Text search index
rateCardSchema.index({
  title: 'text',
  description: 'text',
  practiceArea: 'text'
});

// Virtual for average rating
rateCardSchema.virtual('averageRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / this.reviews.length) * 10) / 10;
});

// Virtual for total reviews count
rateCardSchema.virtual('totalReviews').get(function() {
  return this.reviews.length;
});

// Method to calculate final rate based on complexity
rateCardSchema.methods.calculateRate = function(complexity = 'simple', hours = 1) {
  const multiplier = this.complexityMultipliers[complexity] || 1;
  const baseAmount = this.baseRate * multiplier * hours;
  
  // Apply GST if applicable
  if (this.compliance.gstApplicable) {
    const gstAmount = (baseAmount * this.compliance.gstPercentage) / 100;
    return {
      baseAmount: Math.round(baseAmount),
      gstAmount: Math.round(gstAmount),
      totalAmount: Math.round(baseAmount + gstAmount)
    };
  }
  
  return {
    baseAmount: Math.round(baseAmount),
    gstAmount: 0,
    totalAmount: Math.round(baseAmount)
  };
};

// Method to check availability
rateCardSchema.methods.isAvailable = function() {
  return this.availability.isActive && 
         this.metrics.casesHandled < this.availability.maxConcurrentCases;
};

// Pre-save middleware to update rate history
rateCardSchema.pre('save', function(next) {
  if (this.isModified('baseRate') && !this.isNew) {
    this.rateHistory.push({
      previousRate: this.baseRate,
      changeDate: new Date(),
      changeReason: 'Rate updated',
      updatedBy: this.lawyer
    });
  }
  next();
});

// Static method to get popular practice areas
rateCardSchema.statics.getPopularPracticeAreas = function() {
  return this.aggregate([
    { $match: { 'availability.isActive': true } },
    { $group: { _id: '$practiceArea', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

// Static method to get rate ranges by practice area
rateCardSchema.statics.getRateRanges = function(practiceArea) {
  return this.aggregate([
    { $match: { practiceArea, 'availability.isActive': true } },
    {
      $group: {
        _id: '$serviceType',
        minRate: { $min: '$baseRate' },
        maxRate: { $max: '$baseRate' },
        avgRate: { $avg: '$baseRate' },
        count: { $sum: 1 }
      }
    },
    { $sort: { avgRate: 1 } }
  ]);
};

module.exports = mongoose.model('RateCard', rateCardSchema);
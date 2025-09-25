const mongoose = require('mongoose');

// Invoice model for Indian legal billing
const invoiceSchema = new mongoose.Schema({
  // Invoice Identification
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Associated Payment
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  
  // Case and Parties
  case: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Invoice Details
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Service Details
  services: [{
    description: String,
    quantity: {
      type: Number,
      default: 1
    },
    rate: Number,
    amount: Number,
    serviceType: {
      type: String,
      enum: [
        'consultation',
        'document_drafting',
        'court_representation',
        'legal_research',
        'contract_review',
        'hourly_work',
        'fixed_service',
        'other'
      ]
    }
  }],
  
  // Time Tracking (for hourly billing)
  timeEntries: [{
    date: Date,
    description: String,
    hours: Number,
    rate: Number,
    amount: Number,
    billable: {
      type: Boolean,
      default: true
    }
  }],
  
  // Financial Details
  subtotal: {
    type: Number,
    required: true
  },
  
  // Indian Tax Information
  gst: {
    isApplicable: {
      type: Boolean,
      default: true
    },
    percentage: {
      type: Number,
      default: 18
    },
    amount: {
      type: Number,
      default: 0
    },
    cgst: Number, // Central GST
    sgst: Number, // State GST
    igst: Number  // Integrated GST
  },
  
  // Additional charges
  additionalCharges: [{
    description: String,
    amount: Number,
    taxable: {
      type: Boolean,
      default: true
    }
  }],
  
  // Discounts
  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    value: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    },
    reason: String
  },
  
  // Total Amount
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'draft',
      'sent',
      'viewed',
      'paid',
      'overdue',
      'cancelled',
      'refunded'
    ],
    default: 'draft'
  },
  
  // Payment Status
  paymentStatus: {
    type: String,
    enum: [
      'unpaid',
      'partial',
      'paid',
      'overdue',
      'refunded'
    ],
    default: 'unpaid'
  },
  
  // Lawyer Information (for invoice header)
  lawyerDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    barRegistration: String,
    gstNumber: String,
    panNumber: String
  },
  
  // Client Information (for invoice)
  clientDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    },
    gstNumber: String, // If client is a business
    panNumber: String
  },
  
  // Case Information
  caseDetails: {
    title: String,
    caseNumber: String,
    court: String,
    caseType: String
  },
  
  // Invoice Notes
  notes: {
    public: String,  // Visible to client
    private: String  // Internal lawyer notes
  },
  
  // Terms and Conditions
  terms: {
    paymentTerms: {
      type: String,
      default: 'Payment due within 7 days of invoice date'
    },
    latePaymentFee: {
      applicable: {
        type: Boolean,
        default: false
      },
      percentage: Number,
      description: String
    }
  },
  
  // Digital Signature (for Indian compliance)
  digitalSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    signatureData: String,
    certificate: String
  },
  
  // Invoice Events
  events: [{
    type: {
      type: String,
      enum: ['created', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    description: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // File attachments
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ lawyer: 1, status: 1 });
invoiceSchema.index({ client: 1, paymentStatus: 1 });
invoiceSchema.index({ case: 1 });
invoiceSchema.index({ issueDate: -1 });

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdAt: {
        $gte: new Date(year, new Date().getMonth(), 1),
        $lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    });
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  
  // Calculate totals
  this.calculateTotals();
  
  next();
});

// Method to calculate invoice totals
invoiceSchema.methods.calculateTotals = function() {
  // Calculate subtotal from services
  this.subtotal = this.services.reduce((sum, service) => sum + (service.amount || 0), 0);
  
  // Add time entries
  const timeTotal = this.timeEntries
    .filter(entry => entry.billable)
    .reduce((sum, entry) => sum + (entry.amount || 0), 0);
  this.subtotal += timeTotal;
  
  // Add additional charges
  const additionalTotal = this.additionalCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
  this.subtotal += additionalTotal;
  
  // Apply discount
  if (this.discount.type === 'percentage') {
    this.discount.amount = Math.round((this.subtotal * this.discount.value) / 100);
  } else {
    this.discount.amount = this.discount.value || 0;
  }
  
  const discountedAmount = this.subtotal - this.discount.amount;
  
  // Calculate GST
  if (this.gst.isApplicable) {
    this.gst.amount = Math.round((discountedAmount * this.gst.percentage) / 100);
    
    // For intra-state transactions (same state)
    if (this.lawyerDetails.address?.state === this.clientDetails.address?.state) {
      this.gst.cgst = Math.round(this.gst.amount / 2);
      this.gst.sgst = Math.round(this.gst.amount / 2);
      this.gst.igst = 0;
    } else {
      // For inter-state transactions
      this.gst.igst = this.gst.amount;
      this.gst.cgst = 0;
      this.gst.sgst = 0;
    }
  } else {
    this.gst.amount = 0;
    this.gst.cgst = 0;
    this.gst.sgst = 0;
    this.gst.igst = 0;
  }
  
  // Calculate total
  this.totalAmount = discountedAmount + this.gst.amount;
};

// Method to add event
invoiceSchema.methods.addEvent = function(type, description, metadata = {}) {
  this.events.push({
    type,
    description,
    metadata,
    timestamp: new Date()
  });
  return this.save();
};

// Method to mark as sent
invoiceSchema.methods.markAsSent = function() {
  this.status = 'sent';
  return this.addEvent('sent', 'Invoice sent to client');
};

// Method to mark as paid
invoiceSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  this.paymentStatus = 'paid';
  return this.addEvent('paid', 'Invoice payment received');
};

// Static method to get lawyer invoices
invoiceSchema.statics.getLawyerInvoices = function(lawyerId, filters = {}) {
  const query = { lawyer: lawyerId, ...filters };
  return this.find(query)
    .populate('client', 'name email')
    .populate('case', 'title caseNumber')
    .populate('payment')
    .sort({ createdAt: -1 });
};

// Static method to get client invoices
invoiceSchema.statics.getClientInvoices = function(clientId, filters = {}) {
  const query = { client: clientId, ...filters };
  return this.find(query)
    .populate('lawyer', 'name email')
    .populate('case', 'title caseNumber')
    .populate('payment')
    .sort({ createdAt: -1 });
};

// Static method to get overdue invoices
invoiceSchema.statics.getOverdueInvoices = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    paymentStatus: { $in: ['unpaid', 'partial'] },
    status: { $ne: 'cancelled' }
  })
    .populate('lawyer', 'name email')
    .populate('client', 'name email')
    .populate('case', 'title caseNumber');
};

module.exports = mongoose.model('Invoice', invoiceSchema);
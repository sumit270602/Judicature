const mongoose = require("mongoose");

// Simplified Case Schema for MVP
const caseSchema = new mongoose.Schema(
  {
    // Basic Case Information
    caseNumber: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    
    // Parties Involved
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lawyer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: false
    },
    
    // Case Details
    caseType: { 
      type: String, 
      enum: ['civil', 'criminal', 'family', 'corporate', 'other'],
      required: true 
    },
    
    // Status and Priority
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
    },
    priority: { 
      type: String, 
      enum: ["low", "medium", "high"], 
      default: "medium" 
    },
    
    // Important Dates
    dateOpened: { type: Date, default: Date.now },
    dateClosed: { type: Date },
    nextHearingDate: { type: Date },
    
    // Simple File Storage
    files: [{
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      cloudinaryUrl: { type: String },
      uploadDate: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }],
    
    // Simple Notes
    notes: [{
      content: { type: String, required: true },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      addedAt: { type: Date, default: Date.now }
    }]
  },
  { 
    timestamps: true
  }
);

// Pre-save middleware to generate case number
caseSchema.pre('save', async function(next) {
  if (this.isNew && !this.caseNumber) {
    const count = await mongoose.model('Case').countDocuments();
    const year = new Date().getFullYear();
    this.caseNumber = `CASE-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Static methods for easy querying
caseSchema.statics.findByClient = function(clientId) {
  return this.find({ client: clientId }).populate('lawyer', 'name email');
};

caseSchema.statics.findByLawyer = function(lawyerId) {
  return this.find({ lawyer: lawyerId }).populate('client', 'name email');
};

module.exports = mongoose.model("Case", caseSchema);

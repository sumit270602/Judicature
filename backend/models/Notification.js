
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['deadline', 'court', 'message', 'document', 'system', 'payment', 'verification'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  relatedCase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Case' 
  },
  relatedDocument: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document' 
  },
  actionUrl: String,
  actionRequired: { 
    type: Boolean, 
    default: false 
  },
  expiresAt: Date,
  // Notification delivery tracking
  deliveryStatus: {
    email: { 
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    push: { 
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    inApp: { 
      delivered: { type: Boolean, default: true },
      deliveredAt: { type: Date, default: Date.now }
    }
  },
  // Metadata
  metadata: {
    caseNumber: String,
    documentName: String,
    hearingDate: Date,
    amount: Number,
    dueDate: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static methods
notificationSchema.statics.getUserNotifications = function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('relatedCase', 'title caseNumber')
    .populate('relatedDocument', 'originalName');
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ 
    recipient: userId, 
    isRead: false 
  });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);
  await notification.save();
  
  // TODO: Trigger real-time notification via Socket.IO
  // TODO: Send email notification if needed
  // TODO: Send push notification if enabled
  
  return notification;
};

// Bulk operations
notificationSchema.statics.createDeadlineNotifications = async function(cases) {
  const notifications = cases.map(case_ => ({
    recipient: case_.lawyer,
    type: 'deadline',
    title: 'Case Deadline Approaching',
    message: `${case_.title} has a deadline approaching on ${case_.nextHearingDate?.toLocaleDateString()}`,
    priority: 'high',
    relatedCase: case_._id,
    actionRequired: true,
    metadata: {
      caseNumber: case_.caseNumber,
      hearingDate: case_.nextHearingDate
    }
  }));
  
  return this.insertMany(notifications);
};

notificationSchema.statics.createCourtNotifications = async function(hearings) {
  const notifications = [];
  
  for (const hearing of hearings) {
    // Notify lawyer
    notifications.push({
      recipient: hearing.case.lawyer,
      type: 'court',
      title: 'Court Hearing Scheduled',
      message: `Court hearing for ${hearing.case.title} scheduled on ${hearing.date.toLocaleDateString()} at ${hearing.time}`,
      priority: 'high',
      relatedCase: hearing.case._id,
      actionRequired: true,
      metadata: {
        caseNumber: hearing.case.caseNumber,
        hearingDate: hearing.date
      }
    });
    
    // Notify client
    notifications.push({
      recipient: hearing.case.client,
      type: 'court',
      title: 'Court Hearing Scheduled',
      message: `Your court hearing for ${hearing.case.title} is scheduled on ${hearing.date.toLocaleDateString()} at ${hearing.time}`,
      priority: 'high',
      relatedCase: hearing.case._id,
      metadata: {
        caseNumber: hearing.case.caseNumber,
        hearingDate: hearing.date
      }
    });
  }
  
  return this.insertMany(notifications);
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markEmailSent = function() {
  this.deliveryStatus.email.sent = true;
  this.deliveryStatus.email.sentAt = new Date();
  return this.save();
};

notificationSchema.methods.markEmailError = function(error) {
  this.deliveryStatus.email.error = error;
  return this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
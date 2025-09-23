const mongoose = require('mongoose');

const hearingSchema = new mongoose.Schema({
  case: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Case', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  date: { 
    type: Date, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, // in minutes
    default: 60 
  },
  location: { 
    type: String, 
    required: true 
  },
  courtroom: String,
  judge: String,
  type: { 
    type: String, 
    enum: ['hearing', 'deposition', 'meeting', 'conference', 'trial'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'postponed', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  // Attendees
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['lawyer', 'client', 'witness', 'expert'] },
    attendance: { type: String, enum: ['required', 'optional'], default: 'required' },
    confirmed: { type: Boolean, default: false },
    confirmedAt: Date
  }],
  // Notifications and reminders
  reminders: [{
    type: { type: String, enum: ['email', 'sms', 'push'] },
    timing: { type: Number }, // minutes before hearing
    sent: { type: Boolean, default: false },
    sentAt: Date
  }],
  // Documents related to this hearing
  documents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Document' 
  }],
  // Meeting details
  meetingLink: String, // for virtual hearings
  meetingPassword: String,
  isVirtual: { 
    type: Boolean, 
    default: false 
  },
  // Outcome and notes
  outcome: String,
  notes: String,
  nextSteps: [String],
  // Follow-up hearing
  followUpHearing: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Hearing' 
  },
  // Billing information
  billableHours: Number,
  hourlyRate: Number,
  // Recording information
  recordingUrl: String,
  transcriptUrl: String
}, {
  timestamps: true
});

// Indexes for performance
hearingSchema.index({ case: 1, date: 1 });
hearingSchema.index({ date: 1, status: 1 });
hearingSchema.index({ 'attendees.user': 1, date: 1 });
hearingSchema.index({ status: 1, date: 1 });

// Virtual for formatting
hearingSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

hearingSchema.virtual('formattedDateTime').get(function() {
  return `${this.formattedDate} at ${this.time}`;
});

// Static methods
hearingSchema.statics.getUpcomingHearings = function(userId, userRole, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + days);
  
  const query = userRole === 'lawyer' 
    ? { 'attendees.user': userId, 'attendees.role': 'lawyer' }
    : { 'attendees.user': userId, 'attendees.role': 'client' };
  
  return this.find({
    ...query,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .populate('case', 'title caseNumber')
  .populate('attendees.user', 'name email')
  .sort({ date: 1 });
};

hearingSchema.statics.getTodaysHearings = function(userId, userRole) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const query = userRole === 'lawyer' 
    ? { 'attendees.user': userId, 'attendees.role': 'lawyer' }
    : { 'attendees.user': userId, 'attendees.role': 'client' };
  
  return this.find({
    ...query,
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .populate('case', 'title caseNumber')
  .populate('attendees.user', 'name email')
  .sort({ time: 1 });
};

hearingSchema.statics.getCaseHearings = function(caseId) {
  return this.find({ case: caseId })
    .populate('attendees.user', 'name email role')
    .populate('documents', 'originalName cloudinaryUrl')
    .sort({ date: -1 });
};

hearingSchema.statics.getHearingsNeedingReminders = function() {
  const now = new Date();
  const reminderWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours
  
  return this.find({
    date: { $gte: now, $lte: reminderWindow },
    status: { $in: ['scheduled', 'confirmed'] },
    'reminders.sent': false
  })
  .populate('case', 'title caseNumber')
  .populate('attendees.user', 'name email');
};

// Instance methods
hearingSchema.methods.addAttendee = function(userId, role, attendance = 'required') {
  const existingAttendee = this.attendees.find(a => a.user.toString() === userId.toString());
  
  if (!existingAttendee) {
    this.attendees.push({
      user: userId,
      role,
      attendance,
      confirmed: false
    });
  }
  
  return this.save();
};

hearingSchema.methods.confirmAttendance = function(userId) {
  const attendee = this.attendees.find(a => a.user.toString() === userId.toString());
  
  if (attendee) {
    attendee.confirmed = true;
    attendee.confirmedAt = new Date();
  }
  
  return this.save();
};

hearingSchema.methods.postpone = function(newDate, newTime, reason) {
  this.status = 'postponed';
  this.date = newDate;
  this.time = newTime;
  this.notes = this.notes ? `${this.notes}\n\nPostponed: ${reason}` : `Postponed: ${reason}`;
  
  // Reset reminder flags
  this.reminders.forEach(reminder => {
    reminder.sent = false;
    reminder.sentAt = null;
  });
  
  return this.save();
};

hearingSchema.methods.complete = function(outcome, notes, nextSteps = []) {
  this.status = 'completed';
  this.outcome = outcome;
  this.notes = notes;
  this.nextSteps = nextSteps;
  
  return this.save();
};

hearingSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\n\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  
  return this.save();
};

hearingSchema.methods.addDocument = function(documentId) {
  if (!this.documents.includes(documentId)) {
    this.documents.push(documentId);
  }
  
  return this.save();
};

hearingSchema.methods.setVirtual = function(meetingLink, password) {
  this.isVirtual = true;
  this.meetingLink = meetingLink;
  this.meetingPassword = password;
  
  return this.save();
};

module.exports = mongoose.model('Hearing', hearingSchema);
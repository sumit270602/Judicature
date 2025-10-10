
const Notification = require('../models/Notification');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const emailService = require('./emailService');
const cron = require('node-cron');

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    // Schedule notification checks
    this.scheduleNotificationChecks();
    this.isInitialized = true;
  }

  scheduleNotificationChecks() {
    // Check for deadline reminders every hour
    cron.schedule('0 * * * *', () => {
      this.checkDeadlineReminders();
    });

    // Check for court hearing reminders twice daily
    cron.schedule('0 9,15 * * *', () => {
      this.checkCourtHearingReminders();
    });

    // Cleanup expired notifications daily
    cron.schedule('0 2 * * *', () => {
      this.cleanupExpiredNotifications();
    });
  }

  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Populate related data for real-time emission
      await notification.populate('relatedCase', 'title caseNumber');
      await notification.populate('relatedDocument', 'originalName');

      // TODO: Emit real-time notification via Socket.IO
      // io.to(`user_${notification.recipient}`).emit('notification', notification);

      // Send email notification if required
      if (this.shouldSendEmail(notification)) {
        await this.sendEmailNotification(notification);
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async createCaseNotification(caseId, recipientId, type, title, message, priority = 'medium') {
    return this.createNotification({
      recipient: recipientId,
      type,
      title,
      message,
      priority,
      relatedCase: caseId,
      actionRequired: type === 'deadline' || type === 'court'
    });
  }

  async createDocumentNotification(documentId, recipientId, title, message) {
    return this.createNotification({
      recipient: recipientId,
      type: 'document',
      title,
      message,
      priority: 'medium',
      relatedDocument: documentId
    });
  }

  async createSystemNotification(recipientId, title, message, priority = 'low') {
    return this.createNotification({
      recipient: recipientId,
      type: 'system',
      title,
      message,
      priority
    });
  }

  async notifyNewMessage(senderId, recipientId, caseId, messagePreview) {
    const senderUser = await require('../models/User').findById(senderId).select('name');
    
    return this.createNotification({
      recipient: recipientId,
      type: 'message',
      title: `New message from ${senderUser.name}`,
      message: messagePreview.length > 100 
        ? messagePreview.substring(0, 100) + '...'
        : messagePreview,
      priority: 'medium',
      relatedCase: caseId,
      actionUrl: `/messages/${caseId}`
    });
  }

  async notifyDocumentUploaded(documentId, caseId, uploaderId) {
    const document = await require('../models/Document').findById(documentId);
    const uploader = await require('../models/User').findById(uploaderId).select('name');
    const caseDoc = await Case.findById(caseId).populate('lawyer client', 'name email');

    if (!caseDoc) return;

    // Notify the other party in the case
    const recipientId = uploaderId === caseDoc.lawyer._id.toString() 
      ? caseDoc.client._id 
      : caseDoc.lawyer._id;

    return this.createNotification({
      recipient: recipientId,
      type: 'document',
      title: 'New Document Uploaded',
      message: `${uploader.name} uploaded a new document: ${document.originalName}`,
      priority: 'medium',
      relatedCase: caseId,
      relatedDocument: documentId,
      actionUrl: `/cases/${caseId}/documents`
    });
  }

  async notifyCaseStatusChange(caseId, newStatus, updatedBy) {
    const caseDoc = await Case.findById(caseId).populate('lawyer client', 'name email');
    const updater = await require('../models/User').findById(updatedBy).select('name');

    if (!caseDoc) return;

    // Notify both lawyer and client
    const notifications = [];
    
    const message = `Case status changed to "${newStatus}" by ${updater.name}`;
    
    if (caseDoc.lawyer && updatedBy !== caseDoc.lawyer._id.toString()) {
      notifications.push(this.createCaseNotification(
        caseId,
        caseDoc.lawyer._id,
        'system',
        'Case Status Updated',
        message,
        'medium'
      ));
    }

    if (caseDoc.client && updatedBy !== caseDoc.client._id.toString()) {
      notifications.push(this.createCaseNotification(
        caseId,
        caseDoc.client._id,
        'system',
        'Case Status Updated',
        message,
        'medium'
      ));
    }

    return Promise.all(notifications);
  }

  async checkDeadlineReminders() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const oneDayFromNow = new Date();
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

      // Find cases with upcoming deadlines
      const upcomingCases = await Case.find({
        nextHearingDate: {
          $gte: new Date(),
          $lte: threeDaysFromNow
        },
        status: { $in: ['active', 'pending'] }
      }).populate('lawyer client', 'name email');

      for (const caseDoc of upcomingCases) {
        const daysLeft = Math.ceil((caseDoc.nextHearingDate - new Date()) / (1000 * 60 * 60 * 24));
        
        // Create notifications for both lawyer and client
        if (caseDoc.lawyer) {
          await this.createNotification({
            recipient: caseDoc.lawyer._id,
            type: 'deadline',
            title: 'Case Deadline Approaching',
            message: `${caseDoc.title} has a deadline in ${daysLeft} day(s)`,
            priority: daysLeft <= 1 ? 'urgent' : 'high',
            relatedCase: caseDoc._id,
            actionRequired: true,
            metadata: {
              caseNumber: caseDoc.caseNumber,
              hearingDate: caseDoc.nextHearingDate,
              daysLeft
            }
          });
        }

        if (caseDoc.client) {
          await this.createNotification({
            recipient: caseDoc.client._id,
            type: 'deadline',
            title: 'Case Deadline Approaching',
            message: `Your case "${caseDoc.title}" has an important date in ${daysLeft} day(s)`,
            priority: daysLeft <= 1 ? 'urgent' : 'high',
            relatedCase: caseDoc._id,
            metadata: {
              caseNumber: caseDoc.caseNumber,
              hearingDate: caseDoc.nextHearingDate,
              daysLeft
            }
          });
        }
      }

    } catch (error) {
      console.error('Error checking deadline reminders:', error);
    }
  }

  async checkCourtHearingReminders() {
    try {
      // Check if Hearing model exists
      const Hearing = require('../models/Hearing');
      
      const upcomingHearings = await Hearing.getHearingsNeedingReminders();

      for (const hearing of upcomingHearings) {
        // Notify all attendees
        for (const attendee of hearing.attendees) {
          await this.createNotification({
            recipient: attendee.user._id,
            type: 'court',
            title: 'Court Hearing Reminder',
            message: `Upcoming ${hearing.type}: ${hearing.title} on ${hearing.formattedDateTime}`,
            priority: 'high',
            relatedCase: hearing.case._id,
            actionRequired: true,
            metadata: {
              caseNumber: hearing.case.caseNumber,
              hearingDate: hearing.date,
              hearingTime: hearing.time,
              location: hearing.location
            }
          });
        }

        // Mark reminders as sent
        hearing.reminders.forEach(reminder => {
          if (!reminder.sent) {
            reminder.sent = true;
            reminder.sentAt = new Date();
          }
        });
        await hearing.save();
      }

    } catch (error) {
      if (error.message.includes('Cannot find module')) {
        // Hearing model doesn't exist yet, skip this check
        return;
      }
      console.error('Error checking court hearing reminders:', error);
    }
  }

  async cleanupExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() }
      });

    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    }
  }

  shouldSendEmail(notification) {
    // Send email for high priority or urgent notifications
    return ['high', 'urgent'].includes(notification.priority) ||
           ['deadline', 'court', 'verification'].includes(notification.type);
  }

  async sendEmailNotification(notification) {
    try {
      const user = await require('../models/User').findById(notification.recipient).select('name email');
      
      if (!user || !user.email) {
        return;
      }

      const actionUrl = notification.actionUrl 
        ? `${process.env.FRONTEND_URL}${notification.actionUrl}`
        : `${process.env.FRONTEND_URL}/dashboard`;

      let emailResult;

      switch (notification.type) {
        case 'deadline':
          emailResult = await emailService.sendDeadlineReminder(
            user.email,
            user.name,
            notification.relatedCase?.title || 'Your Case',
            notification.metadata?.hearingDate?.toLocaleDateString() || 'N/A',
            notification.metadata?.daysLeft || 0
          );
          break;

        case 'court':
          emailResult = await emailService.sendCaseNotification(
            user.email,
            user.name,
            notification.relatedCase?.title || 'Your Case',
            notification.message,
            actionUrl
          );
          break;

        case 'verification':
          // Handled separately in auth controller
          break;

        default:
          emailResult = await emailService.sendCaseNotification(
            user.email,
            user.name,
            notification.title,
            notification.message,
            actionUrl
          );
      }

      if (emailResult?.success) {
        notification.deliveryStatus.email.sent = true;
        notification.deliveryStatus.email.sentAt = new Date();
      } else {
        notification.deliveryStatus.email.error = emailResult?.error || 'Unknown error';
      }

      await notification.save();
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        recipient: userId
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async getUserNotifications(userId, options = {}) {
    const {
      page = 1,
      limit = 20,
      type = null,
      priority = null,
      unreadOnly = false
    } = options;

    let query = { recipient: userId };

    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query)
      .populate('relatedCase', 'title caseNumber')
      .populate('relatedDocument', 'originalName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false
    });

    return {
      notifications,
      unreadCount,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = new NotificationService();
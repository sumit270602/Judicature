// Simple EventEmitter implementation for browser compatibility
class SimpleEventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'case' | 'payment' | 'message' | 'system' | 'document';
  userId?: string;
  caseId?: string;
  clientId?: string;
}

class NotificationService extends SimpleEventEmitter {
  private notifications: Notification[] = [];
  private socket: WebSocket | null = null;

  constructor() {
    super();
    this.initializeWebSocket();
    this.loadStoredNotifications();
  }

  private initializeWebSocket() {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected for notifications');
        // Send authentication token if available
        const token = localStorage.getItem('token');
        if (token) {
          this.socket?.send(JSON.stringify({
            type: 'auth',
            token: token
          }));
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification') {
            this.addNotification(data.notification);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        // Reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  private loadStoredNotifications() {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36),
      timestamp: new Date().toISOString(),
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.emit('notification', newNotification);
    this.emit('notificationAdded', newNotification);

    // Show popup for high priority notifications
    if (notification.priority === 'high') {
      this.emit('showPopup', newNotification);
    }

    return newNotification;
  }

  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  getNotificationsByCategory(category: string): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.emit('notificationRead', notification);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.emit('allNotificationsRead');
  }

  deleteNotification(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.emit('notificationDeleted', notificationId);
  }

  clearAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.emit('allNotificationsCleared');
  }

  // NOTE: Only use this for testing purposes - notifications should come from real events
  simulateNotifications() {
    console.warn('simulateNotifications called - this should only be used for testing');
    return; // Disabled - notifications should only come from real events
  }

  // Notification creators for different events
  createCaseNotification(caseData: any, action: 'created' | 'updated' | 'resolved') {
    const actionText = action === 'created' ? 'created' : action === 'updated' ? 'updated' : 'resolved';
    const type = action === 'resolved' ? 'success' : 'info';
    const priority = action === 'created' ? 'high' : 'medium';

    return this.addNotification({
      title: `Case ${actionText}`,
      message: `Case "${caseData.title}" has been ${actionText}`,
      type,
      read: false,
      priority,
      category: 'case',
      caseId: caseData._id,
      clientId: caseData.clientId,
      actionUrl: `/cases/${caseData._id}`,
      actionLabel: 'View Case'
    });
  }

  createPaymentNotification(paymentData: any, action: 'received' | 'pending' | 'overdue') {
    const actionText = action === 'received' ? 'received' : action === 'pending' ? 'is pending' : 'is overdue';
    const type = action === 'received' ? 'success' : action === 'overdue' ? 'error' : 'info';
    const priority = action === 'overdue' ? 'high' : action === 'received' ? 'medium' : 'low';

    return this.addNotification({
      title: `Payment ${action}`,
      message: `Payment of $${paymentData.amount.toLocaleString()} ${actionText}`,
      type,
      read: false,
      priority,
      category: 'payment',
      clientId: paymentData.clientId,
      actionUrl: `/payments/${paymentData._id}`,
      actionLabel: 'View Payment'
    });
  }

  createMessageNotification(messageData: any) {
    return this.addNotification({
      title: 'New Message',
      message: `${messageData.senderName} sent you a message`,
      type: 'info',
      read: false,
      priority: 'low',
      category: 'message',
      clientId: messageData.senderId,
      actionUrl: `/messages/${messageData.conversationId}`,
      actionLabel: 'Read Message'
    });
  }

  createDocumentNotification(documentData: any, caseData: any) {
    return this.addNotification({
      title: 'Document Uploaded',
      message: `New document "${documentData.name}" uploaded for case "${caseData.title}"`,
      type: 'info',
      read: false,
      priority: 'low',
      category: 'document',
      caseId: caseData._id,
      clientId: caseData.clientId,
      actionUrl: `/documents/case/${caseData._id}`,
      actionLabel: 'View Documents'
    });
  }
}

// Create a singleton instance
export const notificationService = new NotificationService();

// Global notification functions for easy use
export const showNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  return notificationService.addNotification(notification);
};

export const showSuccessNotification = (title: string, message: string, actionUrl?: string) => {
  return notificationService.addNotification({
    title,
    message,
    type: 'success',
    read: false,
    priority: 'medium',
    category: 'system',
    actionUrl,
    actionLabel: actionUrl ? 'View' : undefined
  });
};

export const showErrorNotification = (title: string, message: string) => {
  return notificationService.addNotification({
    title,
    message,
    type: 'error',
    read: false,
    priority: 'high',
    category: 'system'
  });
};

export const showInfoNotification = (title: string, message: string) => {
  return notificationService.addNotification({
    title,
    message,
    type: 'info',
    read: false,
    priority: 'low',
    category: 'system'
  });
};

export default notificationService;
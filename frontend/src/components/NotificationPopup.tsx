import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationService, Notification } from '@/services/notificationService';

interface NotificationPopupProps {
  notification: Notification;
  onClose: () => void;
  onAction?: () => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  notification, 
  onClose, 
  onAction 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    setTimeout(() => setIsVisible(true), 100);
    
    // Auto-hide after 5 seconds for non-critical notifications
    if (notification.priority !== 'high') {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleAction = () => {
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success': return 'border-l-green-500';
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`fixed top-20 right-6 z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{ maxWidth: '400px' }}
    >
      <Card className={`p-4 shadow-lg border-l-4 ${getBorderColor()} bg-white`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm text-gray-900 truncate">
                  {notification.title}
                </h4>
                {notification.priority === 'high' && (
                  <Badge className={getPriorityColor()}>
                    High Priority
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
              
              {notification.actionUrl && notification.actionLabel && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAction}
                    className="text-xs"
                  >
                    {notification.actionLabel}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex-shrink-0 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface NotificationSystemProps {
  maxVisible?: number;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ maxVisible = 3 }) => {
  const [popupNotifications, setPopupNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNewNotification = (notification: Notification) => {
      setPopupNotifications(prev => {
        const updated = [notification, ...prev.slice(0, maxVisible - 1)];
        return updated;
      });
    };

    const handleShowPopup = (notification: Notification) => {
      setPopupNotifications(prev => {
        const updated = [notification, ...prev.slice(0, maxVisible - 1)];
        return updated;
      });
    };

    notificationService.on('notification', handleNewNotification);
    notificationService.on('showPopup', handleShowPopup);

    return () => {
      notificationService.off('notification', handleNewNotification);
      notificationService.off('showPopup', handleShowPopup);
    };
  }, [maxVisible]);

  const removePopup = (notificationId: string) => {
    setPopupNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 p-4 pointer-events-auto">
        {popupNotifications.map((notification, index) => (
          <div
            key={notification.id}
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 1000 - index 
            }}
          >
            <NotificationPopup
              notification={notification}
              onClose={() => removePopup(notification.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export { NotificationPopup, NotificationSystem };
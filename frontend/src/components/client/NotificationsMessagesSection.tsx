import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Mail, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  MessageSquare,
  User,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Eye,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  type: 'system' | 'payment' | 'court' | 'message' | 'document' | 'deadline' | 'verification';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  actionUrl?: string;
  actionRequired: boolean;
  relatedCase?: string;
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    role: string;
  };
  recipient: {
    _id: string;
    name: string; 
    role: string;
  };
  content: string;
  timestamp: string;
  isRead: boolean;
  caseId?: string;
  attachments?: any[];
}

const NotificationsMessagesSection: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notificationsResponse, messagesResponse] = await Promise.all([
        api.get('/dashboard/notifications'),
        api.get('/chat/messages').catch(() => ({ data: { messages: [] } }))
      ]);
      
      setNotifications(notificationsResponse.data.notifications || []);
      setMessages(messagesResponse.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch notifications and messages:', error);
      toast.error('Failed to load notifications and messages');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconMap = {
      system: Settings,
      payment: CreditCard,
      court: Calendar,
      message: MessageSquare,
      document: FileText,
      deadline: Clock,
      verification: CheckCircle
    };
    return iconMap[type] || Bell;
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-50';
    if (priority === 'high') return 'text-orange-600 bg-orange-50';
    
    const colorMap = {
      system: 'text-blue-600 bg-blue-50',
      payment: 'text-green-600 bg-green-50',
      court: 'text-red-600 bg-red-50',
      message: 'text-purple-600 bg-purple-50',
      document: 'text-indigo-600 bg-indigo-50',
      deadline: 'text-yellow-600 bg-yellow-50',
      verification: 'text-teal-600 bg-teal-50'
    };
    
    return colorMap[type] || 'text-gray-600 bg-gray-50';
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const priorityConfig = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={priorityConfig[priority]}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const unreadMessages = messages.filter(m => !m.isRead);

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = getNotificationIcon(notification.type);
    const colorClass = getNotificationColor(notification.type, notification.priority);
    
    return (
      <Card className={`${!notification.isRead ? 'border-l-4 border-l-blue-500' : ''} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className={`font-medium text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h4>
                  {getPriorityBadge(notification.priority)}
                </div>
                
                <div className="flex items-center gap-1">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationAsRead(notification._id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600">{notification.message}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(notification.createdAt).toLocaleString()}</span>
                {notification.actionRequired && (
                  <Badge variant="outline" className="text-xs">
                    Action Required
                  </Badge>
                )}
              </div>
              
              {notification.actionUrl && (
                <Button variant="outline" size="sm" className="mt-2">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MessageCard = ({ message }: { message: Message }) => (
    <Card className={`${!message.isRead ? 'border-l-4 border-l-green-500' : ''} hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-green-50 text-green-600">
            <MessageSquare className="h-4 w-4" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className={`font-medium text-sm ${!message.isRead ? 'font-semibold' : ''}`}>
                  From: {message.sender.name}
                </h4>
                <Badge variant="outline">
                  {message.sender.role.charAt(0).toUpperCase() + message.sender.role.slice(1)}
                </Badge>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {new Date(message.timestamp).toLocaleString()}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 line-clamp-3">{message.content}</p>
            
            {message.caseId && (
              <Badge variant="outline" className="text-xs">
                Case Related
              </Badge>
            )}
            
            <Button variant="outline" size="sm" className="mt-2">
              <MessageSquare className="h-4 w-4 mr-1" />
              Reply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications & Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-legal-navy"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications & Messages
            </CardTitle>
            <CardDescription>
              Stay updated with important notifications and messages
            </CardDescription>
          </div>
          
          {unreadNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsAsRead}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadNotifications.length > 0 && (
                <Badge className="ml-1 bg-red-500 text-white">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
              {unreadMessages.length > 0 && (
                <Badge className="ml-1 bg-green-500 text-white">
                  {unreadMessages.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="notifications" className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! New notifications will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationCard key={notification._id} notification={notification} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No messages</h3>
                <p className="text-muted-foreground">
                  Messages from your lawyers will appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {messages.map((message) => (
                    <MessageCard key={message._id} message={message} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default NotificationsMessagesSection;
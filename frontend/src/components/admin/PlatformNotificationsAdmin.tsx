import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Plus, 
  Send, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  data?: any;
}

interface AnnouncementForm {
  title: string;
  message: string;
  targetRole: string;
  priority: string;
}

const PlatformNotificationsAdmin: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>({
    title: '',
    message: '',
    targetRole: 'all',
    priority: 'normal'
  });

  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/notifications?page=${page}&limit=20`);
      setNotifications(response.data.notifications);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      setSendingAnnouncement(true);
      
      const response = await api.post('/admin/announcements', announcementForm);
      
      toast.success(`Announcement sent to ${response.data.recipients} users`);
      setShowAnnouncementDialog(false);
      setAnnouncementForm({
        title: '',
        message: '',
        targetRole: 'all',
        priority: 'normal'
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to send announcement');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'admin_announcement': return <Megaphone className="h-4 w-4" />;
      case 'system_alert': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Platform Notifications</h2>
          <p className="text-gray-600">Manage system notifications and send announcements</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => fetchNotifications()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Platform Announcement</DialogTitle>
                <DialogDescription>
                  Send an announcement to all or specific user groups
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Announcement title..."
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Announcement message..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm(prev => ({
                      ...prev,
                      message: e.target.value
                    }))}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Target Audience</label>
                    <Select
                      value={announcementForm.targetRole}
                      onValueChange={(value) => setAnnouncementForm(prev => ({
                        ...prev,
                        targetRole: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="client">Clients Only</SelectItem>
                        <SelectItem value="lawyer">Lawyers Only</SelectItem>
                        <SelectItem value="admin">Admins Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={announcementForm.priority}
                      onValueChange={(value) => setAnnouncementForm(prev => ({
                        ...prev,
                        priority: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  className="w-full"
                  onClick={handleCreateAnnouncement}
                  disabled={sendingAnnouncement || !announcementForm.title.trim() || !announcementForm.message.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingAnnouncement ? 'Sending...' : 'Send Announcement'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold">{pagination.total}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Announcements</p>
                <p className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.type === 'admin_announcement').length}
                </p>
              </div>
              <Megaphone className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Alerts</p>
                <p className="text-2xl font-bold text-orange-600">
                  {notifications.filter(n => n.type === 'system_alert' || n.type === 'error').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Notifications</CardTitle>
          <CardDescription>
            View all system notifications, announcements, and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-gray-600">No system notifications found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification._id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <Badge variant="outline" className="capitalize">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{notification.title}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-gray-600">
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(notification.priority || 'normal')}>
                          {notification.priority || 'normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {notification.data?.targetRole ? (
                            <Badge variant="secondary" className="capitalize">
                              {notification.data.targetRole}
                            </Badge>
                          ) : (
                            notification.user ? (
                              <div>
                                <div className="font-medium">{notification.user.name}</div>
                                <div className="text-gray-500 capitalize">{notification.user.role}</div>
                              </div>
                            ) : (
                              <span className="text-gray-500">System</span>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchNotifications(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchNotifications(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformNotificationsAdmin;
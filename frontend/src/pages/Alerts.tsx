
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, AlertTriangle, Calendar, FileText, Clock, CheckCircle } from 'lucide-react';

const Alerts = () => {
  const [notifications, setNotifications] = useState({
    deadlines: true,
    courtDates: true,
    clientMessages: true,
    documentUpdates: false,
    systemAlerts: true
  });

  const alerts = [
    {
      id: 1,
      type: 'deadline',
      title: 'Case Filing Deadline Approaching',
      description: 'Smith vs. ABC Corp - Motion due in 2 days',
      priority: 'high',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'court',
      title: 'Court Hearing Tomorrow',
      description: 'Johnson Case - Superior Court, Room 204 at 9:00 AM',
      priority: 'high',
      timestamp: '4 hours ago',
      read: false
    },
    {
      id: 3,
      type: 'message',
      title: 'New Client Message',
      description: 'Michael Brown sent a message regarding his case',
      priority: 'medium',
      timestamp: '6 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'document',
      title: 'Document Review Required',
      description: 'New contract uploaded for Wilson case',
      priority: 'medium',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: 5,
      type: 'system',
      title: 'System Maintenance Scheduled',
      description: 'Platform will be offline for 1 hour on Sunday 2:00 AM',
      priority: 'low',
      timestamp: '2 days ago',
      read: true
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'deadline': return AlertTriangle;
      case 'court': return Calendar;
      case 'message': return Bell;
      case 'document': return FileText;
      case 'system': return Clock;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Badge className="mb-4 bg-legal-navy text-white">
            🔔 Intelligent Alerts
          </Badge>
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Intelligent Alerts & Notifications
          </h1>
          <p className="text-xl text-gray-600">
            Proactive notifications for deadlines, court dates, and important case updates.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Alerts List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Recent Alerts
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                </div>
                <CardDescription>
                  Stay informed about important updates and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const AlertIcon = getAlertIcon(alert.type);
                    return (
                      <div
                        key={alert.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          alert.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${getPriorityColor(alert.priority)}`}>
                            <AlertIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                              <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                                {alert.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{alert.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{alert.timestamp}</span>
                              {!alert.read && (
                                <Button size="sm" variant="ghost" className="text-xs">
                                  Mark as Read
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Sidebar */}
          <div className="space-y-6">
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Customize your alert preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="deadlines" className="text-sm">
                    Deadline Reminders
                  </Label>
                  <Switch
                    id="deadlines"
                    checked={notifications.deadlines}
                    onCheckedChange={() => handleNotificationToggle('deadlines')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="courtDates" className="text-sm">
                    Court Date Alerts
                  </Label>
                  <Switch
                    id="courtDates"
                    checked={notifications.courtDates}
                    onCheckedChange={() => handleNotificationToggle('courtDates')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="clientMessages" className="text-sm">
                    Client Messages
                  </Label>
                  <Switch
                    id="clientMessages"
                    checked={notifications.clientMessages}
                    onCheckedChange={() => handleNotificationToggle('clientMessages')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="documentUpdates" className="text-sm">
                    Document Updates
                  </Label>
                  <Switch
                    id="documentUpdates"
                    checked={notifications.documentUpdates}
                    onCheckedChange={() => handleNotificationToggle('documentUpdates')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="systemAlerts" className="text-sm">
                    System Alerts
                  </Label>
                  <Switch
                    id="systemAlerts"
                    checked={notifications.systemAlerts}
                    onCheckedChange={() => handleNotificationToggle('systemAlerts')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Unread Alerts</span>
                    <Badge className="bg-red-100 text-red-800">2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High Priority</span>
                    <Badge className="bg-orange-100 text-orange-800">2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <Badge className="bg-blue-100 text-blue-800">8</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <CardHeader>
                <CardTitle>Urgent Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="border-l-4 border-red-500 pl-3">
                    <div className="font-medium text-sm">Motion Filing</div>
                    <div className="text-xs text-gray-600">Due in 2 days</div>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-3">
                    <div className="font-medium text-sm">Discovery Response</div>
                    <div className="text-xs text-gray-600">Due in 5 days</div>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-3">
                    <div className="font-medium text-sm">Settlement Conference</div>
                    <div className="text-xs text-gray-600">Due in 1 week</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;

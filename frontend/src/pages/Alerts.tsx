
import { useState } from 'react';
import Header from '../components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle, 
  Search,
  Filter,
  Settings,
  Smartphone,
  Mail,
  MessageSquare,
  Shield,
  Zap,
  Target,
  TrendingUp,
  Eye,
  EyeOff,
  Trash2,
  Archive,
  Star,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Plus
} from 'lucide-react';

const Alerts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([]);
  const [notifications, setNotifications] = useState({
    deadlines: true,
    courtDates: true,
    clientMessages: true,
    documentUpdates: true,
    systemAlerts: true,
    aiInsights: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  // Enhanced alerts with AI categorization and smart prioritization
  const alerts = [
    {
      id: 1,
      type: 'deadline',
      category: 'Critical Legal Deadline',
      title: 'Motion Filing Deadline - URGENT',
      description: 'Employment Contract Review (CASE-2024-001) - Motion for Summary Judgment must be filed by 5:00 PM tomorrow',
      priority: 'critical',
      timestamp: '15 minutes ago',
      read: false,
      aiGenerated: true,
      caseNumber: 'CASE-2024-001',
      client: 'Sarah Johnson',
      daysRemaining: 1,
      estimatedImpact: 'High - Case outcome dependent',
      actions: ['File Motion', 'Set Reminder', 'Contact Client'],
      tags: ['Motion', 'Summary Judgment', 'Deadline']
    },
    {
      id: 2,
      type: 'ai-insight',
      category: 'AI Legal Insight',
      title: 'Pattern Recognition: Similar Case Precedent Found',
      description: 'Our AI identified 3 similar cases with favorable outcomes. Review suggested strategy adjustments.',
      priority: 'high',
      timestamp: '1 hour ago',
      read: false,
      aiGenerated: true,
      caseNumber: 'CASE-2024-001',
      client: 'Sarah Johnson',
      confidenceScore: 94,
      actions: ['Review Analysis', 'Apply Strategy', 'Schedule Review'],
      tags: ['AI Insight', 'Precedent', 'Strategy']
    },
    {
      id: 3,
      type: 'court',
      category: 'Court Schedule',
      title: 'Court Hearing Scheduled - Environmental Compliance',
      description: 'Hearing for Global Manufacturing Corp scheduled for January 28, 2024 at 9:00 AM, Superior Court Room 204',
      priority: 'high',
      timestamp: '2 hours ago',
      read: false,
      aiGenerated: false,
      caseNumber: 'CASE-2024-003',
      client: 'Emily Rodriguez',
      courtRoom: 'Room 204',
      judge: 'Hon. Margaret Chen',
      actions: ['Prepare Arguments', 'Notify Client', 'Schedule Prep Meeting'],
      tags: ['Court Hearing', 'Environmental', 'Compliance']
    },
    {
      id: 4,
      type: 'message',
      category: 'Client Communication',
      title: 'Urgent Client Message - Contract Questions',
      description: 'Michael Chen has questions about investment agreement clauses and requests immediate consultation',
      priority: 'high',
      timestamp: '3 hours ago',
      read: false,
      aiGenerated: false,
      caseNumber: 'CASE-2024-002',
      client: 'Michael Chen',
      messageType: 'Secure Message',
      actions: ['Reply Message', 'Schedule Call', 'Send Documents'],
      tags: ['Client Message', 'Investment', 'Urgent']
    },
    {
      id: 5,
      type: 'document',
      category: 'Document Management',
      title: 'AI Document Analysis Complete',
      description: 'Contract analysis for Real Estate Professionals completed. 3 potential issues identified.',
      priority: 'medium',
      timestamp: '4 hours ago',
      read: true,
      aiGenerated: true,
      caseNumber: 'CASE-2024-004',
      client: 'David Thompson',
      documentType: 'Purchase Agreement',
      issuesFound: 3,
      actions: ['Review Issues', 'Contact Client', 'Draft Amendments'],
      tags: ['AI Analysis', 'Contract', 'Real Estate']
    },
    {
      id: 6,
      type: 'billing',
      category: 'Financial Alert',
      title: 'Billing Milestone Reached',
      description: 'Case CASE-2024-001 has reached 80% of approved budget. Consider discussing additional funding with client.',
      priority: 'medium',
      timestamp: '6 hours ago',
      read: true,
      aiGenerated: true,
      caseNumber: 'CASE-2024-001',
      client: 'Sarah Johnson',
      budgetUsed: '80%',
      remainingBudget: '$4,500',
      actions: ['Contact Client', 'Review Budget', 'Adjust Scope'],
      tags: ['Billing', 'Budget', 'Financial']
    },
    {
      id: 7,
      type: 'compliance',
      category: 'Compliance Monitor',
      title: 'Regulatory Filing Reminder',
      description: 'SEC filing deadline approaching for Corporate Merger Advisory case in 5 days',
      priority: 'high',
      timestamp: '1 day ago',
      read: true,
      aiGenerated: true,
      caseNumber: 'CASE-2024-005',
      client: 'TechCorp Industries',
      filingType: 'SEC Form 10-K',
      daysRemaining: 5,
      actions: ['Prepare Filing', 'Client Review', 'Submit Documents'],
      tags: ['SEC Filing', 'Compliance', 'Corporate']
    }
  ];

  // Notification settings with categories
  const notificationCategories = [
    {
      id: 'legal',
      title: 'Legal Operations',
      description: 'Court dates, deadlines, filings',
      settings: ['deadlines', 'courtDates', 'compliance']
    },
    {
      id: 'communication',
      title: 'Client Communication',
      description: 'Messages, calls, document sharing',
      settings: ['clientMessages', 'documentUpdates']
    },
    {
      id: 'ai',
      title: 'AI Intelligence',
      description: 'AI insights, predictions, recommendations',
      settings: ['aiInsights', 'patternRecognition']
    },
    {
      id: 'system',
      title: 'System & Security',
      description: 'System updates, security alerts',
      settings: ['systemAlerts', 'securityUpdates']
    }
  ];

  // Smart insights and analytics
  const alertAnalytics = {
    totalAlerts: alerts.length,
    unreadAlerts: alerts.filter(a => !a.read).length,
    criticalAlerts: alerts.filter(a => a.priority === 'critical').length,
    aiGeneratedAlerts: alerts.filter(a => a.aiGenerated).length,
    responseTime: '12 minutes',
    resolutionRate: '94%'
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'deadline': return AlertTriangle;
      case 'court': return Calendar;
      case 'message': return MessageSquare;
      case 'document': return FileText;
      case 'system': return Clock;
      case 'ai-insight': return Zap;
      case 'billing': return TrendingUp;
      case 'compliance': return Shield;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleNotificationToggle = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAlert = (alertId: number) => {
    setSelectedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleMarkAsRead = (alertIds: number[]) => {
    // Mark selected alerts as read
    console.log('Marking as read:', alertIds);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesPriority = filterPriority === 'all' || alert.priority === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="mb-4 bg-legal-navy text-white">
              🔔 Live Intelligent Alerts
            </Badge>
            <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
              AI-Powered Alert Management
            </h1>
            <p className="text-xl text-gray-600">
              Experience Judicature's intelligent notification system with AI-generated insights, smart prioritization, and proactive deadline management.
            </p>
          </div>

          {/* Alert Analytics Dashboard */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Alerts</p>
                    <p className="text-2xl font-bold text-legal-navy">{alertAnalytics.totalAlerts}</p>
                    <p className="text-xs text-blue-600 mt-1">{alertAnalytics.aiGeneratedAlerts} AI-generated</p>
                  </div>
                  <Bell className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-legal-navy">{alertAnalytics.unreadAlerts}</p>
                    <p className="text-xs text-red-600 mt-1">{alertAnalytics.criticalAlerts} critical</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold text-legal-navy">{alertAnalytics.responseTime}</p>
                    <p className="text-xs text-green-600 mt-1">↓ 25% improvement</p>
                  </div>
                  <Target className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolution Rate</p>
                    <p className="text-2xl font-bold text-legal-navy">{alertAnalytics.resolutionRate}</p>
                    <p className="text-xs text-green-600 mt-1">↑ 12% this month</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-legal-navy" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="alerts" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-lg grid-cols-4">
                <TabsTrigger value="alerts">All Alerts</TabsTrigger>
                <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
                <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(selectedAlerts)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Read ({selectedAlerts.length})
                </Button>
                <Button variant="outline" size="sm">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>

            <TabsContent value="alerts" className="space-y-6">
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Alerts List */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Smart Alerts & Notifications
                      </CardTitle>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                    
                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search alerts, cases, clients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="deadline">Deadlines</SelectItem>
                          <SelectItem value="court">Court Dates</SelectItem>
                          <SelectItem value="ai-insight">AI Insights</SelectItem>
                          <SelectItem value="message">Messages</SelectItem>
                          <SelectItem value="document">Documents</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {filteredAlerts.map((alert) => {
                        const AlertIcon = getAlertIcon(alert.type);
                        const isSelected = selectedAlerts.includes(alert.id);
                        
                        return (
                          <div
                            key={alert.id}
                            className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                              alert.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                            } ${isSelected ? 'ring-2 ring-legal-navy' : ''}`}
                          >
                            <div className="flex items-start space-x-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectAlert(alert.id)}
                                className="mt-1"
                              />
                              
                              <div className={`p-3 rounded-full ${getPriorityColor(alert.priority)}`}>
                                <AlertIcon className="h-5 w-5" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                                      {alert.aiGenerated && (
                                        <Badge variant="outline" className="text-xs">
                                          <Zap className="h-3 w-3 mr-1" />
                                          AI
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-1">{alert.category}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={getPriorityBadge(alert.priority)}>
                                      {alert.priority}
                                    </Badge>
                                    {!alert.read && (
                                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-3">{alert.description}</p>
                                
                                {/* Case and Client Info */}
                                {alert.caseNumber && (
                                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      {alert.caseNumber}
                                    </span>
                                    {alert.client && (
                                      <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        {alert.client}
                                      </span>
                                    )}
                                    {alert.confidenceScore && (
                                      <span className="flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        {alert.confidenceScore}% confidence
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Action Tags */}
                                {alert.tags && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {alert.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Actions and Timestamp */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {alert.actions?.slice(0, 3).map((action, index) => (
                                      <Button key={index} size="sm" variant="outline" className="text-xs">
                                        {action}
                                      </Button>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="h-3 w-3" />
                                    {alert.timestamp}
                                    {!alert.read && (
                                      <Button size="sm" variant="ghost" className="text-xs">
                                        <Eye className="h-3 w-3 mr-1" />
                                        Mark Read
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Sidebar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button className="w-full bg-legal-navy hover:bg-legal-navy/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Alert
                    </Button>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Alert Summary</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unread</span>
                          <Badge variant="destructive">{alertAnalytics.unreadAlerts}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Critical</span>
                          <Badge variant="destructive">{alertAnalytics.criticalAlerts}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">AI Generated</span>
                          <Badge variant="outline">{alertAnalytics.aiGeneratedAlerts}</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-medium text-sm">Critical Deadlines</h4>
                      <div className="space-y-2">
                        <div className="border-l-4 border-red-500 pl-3">
                          <div className="font-medium text-sm">Motion Filing</div>
                          <div className="text-xs text-gray-600">Tomorrow 5:00 PM</div>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-3">
                          <div className="font-medium text-sm">Court Hearing</div>
                          <div className="text-xs text-gray-600">Jan 28, 9:00 AM</div>
                        </div>
                        <div className="border-l-4 border-yellow-500 pl-3">
                          <div className="font-medium text-sm">SEC Filing</div>
                          <div className="text-xs text-gray-600">5 days remaining</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai-insights" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    AI-Generated Insights
                  </CardTitle>
                  <CardDescription>
                    Intelligent predictions and recommendations from our AI analysis engine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.filter(alert => alert.aiGenerated).map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Zap className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{alert.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                            {alert.confidenceScore && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Confidence Score:</span>
                                <Badge variant="outline">{alert.confidenceScore}%</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deadlines" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Critical Legal Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {alerts.filter(alert => alert.type === 'deadline').map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge variant="destructive">
                            {alert.daysRemaining} day{alert.daysRemaining !== 1 ? 's' : ''} left
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Case: {alert.caseNumber}</span>
                          <span>Client: {alert.client}</span>
                          {alert.estimatedImpact && <span>Impact: {alert.estimatedImpact}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Channels</CardTitle>
                    <CardDescription>Choose how you want to receive alerts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <Label className="text-sm">Email Notifications</Label>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={() => handleNotificationToggle('emailNotifications')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <Label className="text-sm">SMS Notifications</Label>
                      </div>
                      <Switch
                        checked={notifications.smsNotifications}
                        onCheckedChange={() => handleNotificationToggle('smsNotifications')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <Label className="text-sm">Push Notifications</Label>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={() => handleNotificationToggle('pushNotifications')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Alert Categories</CardTitle>
                    <CardDescription>Configure alerts by category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {notificationCategories.map((category) => (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium">{category.title}</h4>
                            <p className="text-xs text-gray-500">{category.description}</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
